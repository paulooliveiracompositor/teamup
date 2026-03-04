export interface Reservation {
  id: number | string;
  professor_name: string;
  equipment_type: { id: number; value: string; color: string } | string; // Baserow select field returns object or id
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  subject: string;
  class_name: string;
  created_at?: string;
}

export interface EquipmentOption {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

// Helper to handle Baserow's single select structure
export type BaserowSingleSelect = {
  id: number;
  value: string;
  color: string;
};

export const EQUIPMENT_TYPES: EquipmentOption[] = [
  { id: 'Datashow', label: 'Datashow', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700/50', icon: '📽️' },
  { id: 'TV', label: 'TV', color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-700/50', icon: '📺' },
  { id: 'Notebook', label: 'Notebook', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700/50', icon: '💻' },
  { id: 'Caixa de Som', label: 'Caixa de Som', color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-700/50', icon: '🔊' },
  { id: 'Microfone', label: 'Microfone', color: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700/50', icon: '🎤' },
  { id: 'Sala de Video', label: 'Sala de Vídeo', color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700/50', icon: '🎬' },
  { id: 'Auditorio', label: 'Auditório', color: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700/50', icon: '🏛️' },
];