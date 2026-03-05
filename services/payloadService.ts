/// <reference types="vite/client" />
import { Reservation } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ENDPOINT = `${API_URL}/api/reservations`;

// Helper to get Auth Token
export const getAuthToken = () => {
  return localStorage.getItem('teamup_payload_token');
};

const getHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `JWT ${token}` } : {})
  };
};

const LOCAL_STORAGE_KEY = 'teamup_reservations_backup';

// Helper to get local data
const getLocalData = (): Reservation[] => {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Helper to save local data
const setLocalData = (data: Reservation[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

export const payloadService = {
  async getReservations(): Promise<Reservation[]> {
    try {
      const response = await fetch(`${ENDPOINT}?limit=200`, {
        headers: getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error("Unauthorized");
        console.warn("Payload API unavailable, switching to Offline Data.");
        return getLocalData();
      }

      const data = await response.json();
      // Payload returns data inside 'docs' array
      const results = data.docs;
      setLocalData(results);
      return results;

    } catch (error) {
      if ((error as Error).message === "Unauthorized") throw error;
      console.error("Network error, using Offline Data:", error);
      return getLocalData();
    }
  },

  async createReservation(reservation: Partial<Reservation>): Promise<Reservation> {
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(reservation)
      });

      if (!response.ok) {
        console.warn("API Error on create, using fallback.");
        return this.mockCreate(reservation);
      }
      const data = await response.json();
      const newRes = data.doc; // Payload returns the created document in 'doc'

      const current = getLocalData();
      setLocalData([...current, newRes]);

      return newRes;
    } catch (error) {
      return this.mockCreate(reservation);
    }
  },

  async updateReservation(id: number | string, updates: Partial<Reservation>): Promise<Reservation> {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'PATCH', // Payload uses PATCH for updates too
        headers: getHeaders(),
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update');
      const data = await response.json();
      const updatedRes = data.doc;

      const current = getLocalData();
      setLocalData(current.map(r => r.id === id ? updatedRes : r));

      return updatedRes;
    } catch (error) {
      return this.mockUpdate(id as number, updates);
    }
  },

  async deleteReservation(id: number | string): Promise<void> {
    try {
      const response = await fetch(`${ENDPOINT}/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (!response.ok) throw new Error('Failed to delete');

      const current = getLocalData();
      setLocalData(current.filter(r => r.id !== id));

    } catch (error) {
      return this.mockDelete(id as number);
    }
  },

  // --- MOCK IMPLEMENTATIONS (Demo Mode) ---

  async mockCreate(reservation: Partial<Reservation>): Promise<Reservation> {
    console.log("Creating reservation locally (Demo Mode)");
    await new Promise(r => setTimeout(r, 400 + Math.random() * 200));
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
    if (index === -1) throw new Error("Reservation not found locally");
    const updated = { ...current[index], ...updates };
    current[index] = updated;
    setLocalData(current);
    return updated;
  },

  async mockDelete(id: number): Promise<void> {
    console.log("Deleting locally (Demo Mode)");
    await new Promise(r => setTimeout(r, 400));
    const current = getLocalData();
    setLocalData(current.filter(r => r.id !== id));
  },

  async login(email: string, password: string): Promise<{ token: string, user: any }> {
    const res = await fetch(`${API_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.errors?.[0]?.message || 'Login failed');
    localStorage.setItem('teamup_payload_token', data.token);
    return data;
  },

  logout() {
    localStorage.removeItem('teamup_payload_token');
  }
};