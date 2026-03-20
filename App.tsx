import React, { useState, useEffect } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { Reservation, ToastMessage } from './types';
import { notificationService } from './services/notificationService';
import { useReservations, useCreateReservation, useDeleteReservation, useUpdateReservation } from './hooks/useReservations';
import CalendarView from './components/CalendarView';
import ReservationForm from './components/ReservationForm';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import HelpModal from './components/HelpModal';
import InstallPWA from './components/InstallPWA';
import { ToastContainer } from './components/ui/Toast';
import { supabaseService } from './services/supabaseService';
import { useTheme } from './hooks/useTheme';

// Simple Overlay Modal
const Modal = ({ children, onClose }: { children?: React.ReactNode, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar transition-colors">
      {children}
    </div>
    <div className="absolute inset-0 -z-10" onClick={onClose}></div>
  </div>
);

const App: React.FC = () => {
  // React Query Hooks
  const { data, isLoading, isError } = useReservations();
  const reservations = (data || []) as Reservation[];
  const createMutation = useCreateReservation();
  const deleteMutation = useDeleteReservation();
  const updateMutation = useUpdateReservation();

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  // Use currentUser state to lock the app instead of simple isAdmin
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { theme, toggleTheme } = useTheme();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Selected reservation details for viewing/cancelling by user (simple view)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  // Initial Checks
  useEffect(() => {
    setNotificationPermission(notificationService.getPermissionState());

    // Restore session from Supabase
    supabaseService.restoreSession().then(user => {
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('teamup_current_user', JSON.stringify(user));
      }
    });
  }, []);

  // Check notifications when data loads
  useEffect(() => {
    if (reservations.length > 0) {
      notificationService.checkAndNotify(reservations);
    }
  }, [reservations]);

  // Error handling for initial fetch
  useEffect(() => {
    if (isError) {
      addToast('error', 'Sua sessão expirou ou houve um erro.');
      handleLogout(); // Force logout on auth error
    }
  }, [isError]);

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleCreateReservation = async (dataList: Partial<Reservation>[]) => {
    try {
      // Loop through multiple equipment selections and create individually
      await Promise.all(dataList.map(data => createMutation.mutateAsync({
        ...data,
        professor_name: currentUser?.name || data.professor_name
      })));

      // Add a small delay so the user can see the "Success" animation on the button inside the modal
      await new Promise(resolve => setTimeout(resolve, 1500));

      addToast('success', `${dataList.length} reserva(s) criada(s) com sucesso!`);
      setIsFormOpen(false);
      // No need to manually fetch, React Query handles invalidation via the hook
    } catch (error) {
      console.error(error);
      addToast('error', 'Erro ao criar reservas. Tente novamente.');
    }
  };

  const handleDeleteReservation = async (id: number | string) => {
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', 'Reserva removida.');
      setSelectedReservation(null);
    } catch (error) {
      addToast('error', 'Erro ao remover reserva.');
    }
  };

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    localStorage.setItem('teamup_current_user', JSON.stringify(user));
    addToast('success', `Bem-vindo(a), ${user.name || user.email}!`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('teamup_current_user');
    supabaseService.logout();
    addToast('info', 'Deslogado com sucesso.');
  };

  const requestNotifications = async () => {
    const granted = await notificationService.requestPermission();
    if (granted) {
      setNotificationPermission('granted');
      addToast('success', 'Notificações ativadas! Lembraremos você 1 dia antes das reservas.');
      // Re-check immediately
      notificationService.checkAndNotify(reservations);
    } else {
      setNotificationPermission('denied');
      addToast('info', 'Notificações não foram permitidas.');
    }
  };

  const handleUpdateReservation = async (id: number | string, updates: Partial<Reservation>) => {
    try {
      await updateMutation.mutateAsync({ id, updates });
      addToast('success', 'Reserva atualizada com sucesso!');
    } catch (error) {
      addToast('error', 'Erro ao atualizar reserva.');
    }
  };

  const isOperationLoading = createMutation.isPending || deleteMutation.isPending || updateMutation.isPending;

  // IF NOT LOGGED IN, RENDER ONLY THE LOGIN SCREEN
  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6 text-center border-b dark:border-gray-700 bg-gradient-to-r from-primary to-purple-700">
            <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-3xl mb-3 shadow-inner">
              📅
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none">Team-Up</h1>
            <p className="text-sm text-blue-100 font-medium mt-1">Reservas de Recursos Didáticos</p>
          </div>
          <Login onLogin={handleLogin} />
        </div>
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-purple-700 text-white shadow-lg sticky top-0 z-30">
          <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center text-xl">
                📅
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight leading-none">Team-Up</h1>
                <p className="text-xs text-blue-100 font-medium mt-0.5">Reservas de Recursos Didáticos</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              {notificationPermission !== 'denied' && (
                <button
                  onClick={requestNotifications}
                  className={`p-2 rounded-full transition-colors backdrop-blur-sm relative ${notificationPermission === 'granted' ? 'bg-white/20 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                  aria-label="Ativar Notificações"
                  title={notificationPermission === 'granted' ? 'Notificações ativas' : 'Ativar lembretes'}
                >
                  <span className="text-lg">🔔</span>
                  {notificationPermission === 'default' && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-primary"></span>
                  )}
                </button>
              )}

              {/* Help Button */}
              <button
                onClick={() => setIsHelpOpen(true)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm text-white"
                aria-label="Ajuda"
                title="Como usar o app"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </button>

              <button
                onClick={toggleTheme}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                aria-label="Toggle Dark Mode"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>

              <button onClick={handleLogout} className="text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full transition backdrop-blur-sm text-white">
                Sair
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6 flex-grow">
          {currentUser?.role === 'admin' ? (
            <AdminDashboard
              reservations={reservations}
              onDelete={handleDeleteReservation}
              onUpdate={handleUpdateReservation}
              onLogout={handleLogout}
            />
          ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Calendário</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {isOperationLoading ? 'Atualizando...' : 'Gerencie as reservas de equipamentos.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedDate(new Date());
                  setIsFormOpen(true);
                }}
                className="bg-secondary hover:bg-emerald-500 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2 font-medium"
              >
                <span>+</span> Nova Reserva
              </button>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <CalendarView
                reservations={reservations}
                onSelectDate={(date) => {
                  setSelectedDate(date);
                  setIsFormOpen(true);
                }}
                onSelectReservation={(res) => setSelectedReservation(res)}
              />
            )}
          </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200 dark:border-gray-700 py-6 mt-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Escola Modelo de Conceição 2026
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Coordenação: Samila Porto
            </p>
          </div>
        </footer>

        {/* Modals */}
        {isFormOpen && (
          <Modal onClose={() => setIsFormOpen(false)}>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-white">Nova Reserva</h3>
              <ReservationForm
                existingReservations={reservations}
                onSubmit={handleCreateReservation}
                onCancel={() => setIsFormOpen(false)}
                isLoading={isOperationLoading}
                initialDate={selectedDate}
              />
            </div>
          </Modal>
        )}

        {isHelpOpen && (
          <Modal onClose={() => setIsHelpOpen(false)}>
            <HelpModal onClose={() => setIsHelpOpen(false)} />
          </Modal>
        )}

        {selectedReservation && (
          <Modal onClose={() => setSelectedReservation(null)}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Detalhes da Reserva</h3>
                <button onClick={() => setSelectedReservation(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
              </div>

              <div className="space-y-3 mb-6 dark:text-gray-200">
                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Equipamento</span>
                  <span className="font-medium text-primary dark:text-indigo-400">
                    {typeof selectedReservation.equipment_type === 'object' ? selectedReservation.equipment_type.value : selectedReservation.equipment_type}
                  </span>
                </div>
                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Professor</span>
                  <span className="font-medium">{selectedReservation.professor_name}</span>
                </div>
                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Data</span>
                  <span className="font-medium">{selectedReservation.date.split('-').reverse().join('/')}</span>
                </div>
                <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                  <span className="text-gray-500 dark:text-gray-400">Horário</span>
                  <span className="font-medium">{selectedReservation.start_time} - {selectedReservation.end_time}</span>
                </div>
                {selectedReservation.subject && (
                  <div className="flex justify-between border-b dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400">Disciplina</span>
                    <span className="font-medium">{selectedReservation.subject}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    if (window.confirm("Para cancelar reservas de outros professores, contate a coordenação. Se esta é sua, confirme.")) {
                      handleDeleteReservation(selectedReservation.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-100 dark:border-red-800"
                  disabled={isOperationLoading}
                >
                  {isOperationLoading ? 'Cancelando...' : 'Cancelar Reserva'}
                </button>
              </div>
            </div>
          </Modal>
        )}

        <InstallPWA />
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      </div>
    </Router>
  );
};

export default App;