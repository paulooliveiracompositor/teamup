import { createClient } from '@supabase/supabase-js';
import { Reservation } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_STORAGE_KEY = 'teamup_reservations_backup';

const getLocalData = (): Reservation[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

const setLocalData = (data: Reservation[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

const getAccessToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

export const supabaseService = {

  async getReservations(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: true })
      .limit(500);

    if (error) {
      console.warn('Supabase unavailable, using offline data:', error.message);
      return getLocalData();
    }

    const results = data as Reservation[];
    setLocalData(results);
    return results;
  },

  async createReservation(reservation: Partial<Reservation>): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation])
      .select()
      .single();

    if (error) {
      console.warn('API Error on create, using fallback:', error.message);
      return this.mockCreate(reservation);
    }

    const newRes = data as Reservation;
    const current = getLocalData();
    setLocalData([...current, newRes]);
    return newRes;
  },

  async updateReservation(id: number | string, updates: Partial<Reservation>): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return this.mockUpdate(id as number, updates);

    const updatedRes = data as Reservation;
    const current = getLocalData();
    setLocalData(current.map(r => r.id === id ? updatedRes : r));
    return updatedRes;
  },

  async deleteReservation(id: number | string): Promise<void> {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', id);

    if (error) return this.mockDelete(id as number);

    const current = getLocalData();
    setLocalData(current.filter(r => r.id !== id));
  },

  // --- AUTH ---

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    const session = data.session!;
    const user = data.user!;
    localStorage.setItem('teamup_supabase_token', session.access_token);

    return {
      token: session.access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        role: user.user_metadata?.role || 'professor',
      }
    };
  },

  async logout() {
    await supabase.auth.signOut();
    localStorage.removeItem('teamup_supabase_token');
    localStorage.removeItem('teamup_current_user');
  },

  async restoreSession(): Promise<any | null> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const user = data.session.user;
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
      role: user.user_metadata?.role || 'professor',
    };
  },

  // --- GERENCIAMENTO DE PROFESSORES (apenas admin) ---

  async getProfessors(): Promise<any[]> {
    const token = await getAccessToken();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('Erro ao buscar professores');
    return response.json();
  },

  async createProfessor(email: string, password: string, name: string): Promise<any> {
    const token = await getAccessToken();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, role: 'professor' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Erro ao criar professor');
    return data;
  },

  async deleteProfessor(userId: string): Promise<void> {
    const token = await getAccessToken();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/manage-users`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) throw new Error('Erro ao remover professor');
  },

  // --- MOCK FALLBACKS ---

  async mockCreate(reservation: Partial<Reservation>): Promise<Reservation> {
    await new Promise(r => setTimeout(r, 400));
    const current = getLocalData();
    const newRes = {
      ...reservation,
      id: Date.now() + Math.floor(Math.random() * 100000),
      created_at: new Date().toISOString()
    } as Reservation;
    setLocalData([...current, newRes]);
    return newRes;
  },

  async mockUpdate(id: number, updates: Partial<Reservation>): Promise<Reservation> {
    await new Promise(r => setTimeout(r, 400));
    const current = getLocalData();
    const index = current.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Reservation not found locally');
    const updated = { ...current[index], ...updates };
    current[index] = updated;
    setLocalData(current);
    return updated;
  },

  async mockDelete(id: number): Promise<void> {
    await new Promise(r => setTimeout(r, 400));
    const current = getLocalData();
    setLocalData(current.filter(r => r.id !== id));
  },
};
