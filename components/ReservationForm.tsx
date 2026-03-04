import React, { useState, useEffect } from 'react';
import { Reservation, EQUIPMENT_TYPES } from '../types';
import { isTimeOverlap } from '../utils/dateHelpers';

interface Props {
  existingReservations: Reservation[];
  onSubmit: (data: Partial<Reservation>[]) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  initialDate?: Date;
}

const ReservationForm: React.FC<Props> = ({ existingReservations, onSubmit, onCancel, isLoading, initialDate }) => {
  const [formData, setFormData] = useState({
    professor_name: '',
    date: initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '09:00',
    subject: '',
    class_name: '',
  });
  
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // Load last used name for convenience
  useEffect(() => {
    const savedName = localStorage.getItem('lastProfessorName');
    if (savedName) {
      setFormData(prev => ({ ...prev, professor_name: savedName }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedEquipments(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEquipments.length === 0) {
      setError("Selecione pelo menos um equipamento.");
      return;
    }

    const start = formData.start_time;
    const end = formData.end_time;
    
    if (start >= end) {
      setError("A hora final deve ser maior que a hora inicial.");
      return;
    }

    for (const equipId of selectedEquipments) {
      if (equipId === 'Sala de Video') {
         const hour = parseInt(start.split(':')[0], 10);
         if (hour < 13) {
           setError("A Sala de Vídeo só pode ser reservada no período vespertino (após 13:00).");
           return;
         }
      }

      const conflicts = existingReservations.filter(res => {
        if (res.date !== formData.date) return false;
        const resEquip = typeof res.equipment_type === 'object' ? res.equipment_type.value : res.equipment_type;
        if (resEquip !== equipId) return false;
        return isTimeOverlap(start, end, res.start_time, res.end_time);
      });

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        const equipLabel = EQUIPMENT_TYPES.find(e => e.id === equipId)?.label || equipId;
        setError(`❌ Indisponível: O item '${equipLabel}' já foi reservado por ${conflict.professor_name} das ${conflict.start_time} às ${conflict.end_time}.`);
        return;
      }
    }

    // Save identity for notifications
    localStorage.setItem('lastProfessorName', formData.professor_name);

    const newReservations = selectedEquipments.map(equipId => ({
      ...formData,
      equipment_type: equipId
    }));

    // Handle Submission State locally to control animation
    setFormStatus('submitting');
    try {
      await onSubmit(newReservations);
      setFormStatus('success');
      // The parent component (App.tsx) handles the delay and closing
    } catch (err) {
      console.error(err);
      setFormStatus('idle');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Professor *</label>
        <input
          required
          type="text"
          name="professor_name"
          value={formData.professor_name}
          onChange={handleChange}
          disabled={formStatus !== 'idle'}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition bg-white dark:bg-gray-700 dark:text-white disabled:opacity-60"
          placeholder="Ex: João Silva"
        />
        <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">Usado para identificar suas reservas e enviar lembretes.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data *</label>
           <input
             required
             type="date"
             name="date"
             value={formData.date}
             onChange={handleChange}
             disabled={formStatus !== 'idle'}
             className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white disabled:opacity-60"
           />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Início *</label>
          <input
            required
            type="time"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            disabled={formStatus !== 'idle'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white disabled:opacity-60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fim *</label>
          <input
            required
            type="time"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            disabled={formStatus !== 'idle'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white disabled:opacity-60"
          />
        </div>
      </div>

      <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Equipamentos *</label>
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
           {EQUIPMENT_TYPES.map(eq => {
             const isSelected = selectedEquipments.includes(eq.id);
             return (
               <label 
                 key={eq.id} 
                 className={`
                   relative flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all
                   ${isSelected ? 'border-primary bg-blue-50/50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'}
                   ${formStatus !== 'idle' ? 'opacity-60 pointer-events-none' : ''}
                 `}
               >
                 <input 
                   type="checkbox" 
                   className="absolute opacity-0 w-full h-full cursor-pointer"
                   checked={isSelected}
                   onChange={() => handleCheckboxChange(eq.id)}
                   disabled={formStatus !== 'idle'}
                 />
                 <span className="text-xl mb-1">{eq.icon}</span>
                 <span className={`text-xs font-medium text-center ${isSelected ? 'text-primary dark:text-blue-300' : 'text-gray-600 dark:text-gray-300'}`}>
                   {eq.label}
                 </span>
                 {isSelected && (
                   <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></div>
                 )}
               </label>
             );
           })}
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Disciplina</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            disabled={formStatus !== 'idle'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white disabled:opacity-60"
            placeholder="Matemática"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Turma</label>
          <input
            type="text"
            name="class_name"
            value={formData.class_name}
            onChange={handleChange}
            disabled={formStatus !== 'idle'}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white disabled:opacity-60"
            placeholder="3º A"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded border border-red-200 dark:border-red-800 text-sm animate-pulse font-medium">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          disabled={formStatus !== 'idle'}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={`flex-1 px-4 py-2 text-white rounded-lg shadow-md transition-all duration-300 transform flex items-center justify-center gap-2
            ${formStatus === 'success' 
              ? 'bg-green-500 hover:bg-green-600 scale-105' 
              : 'bg-gradient-to-r from-primary to-purple-600 hover:opacity-90'
            }
            ${formStatus === 'idle' ? 'disabled:opacity-50' : ''}
          `}
          disabled={formStatus !== 'idle' && formStatus !== 'success'}
        >
          {formStatus === 'idle' && `Confirmar (${selectedEquipments.length})`}
          
          {formStatus === 'submitting' && (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Salvando...
            </>
          )}

          {formStatus === 'success' && (
            <>
              <svg className="w-5 h-5 animate-scale-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" className="checkmark-path" />
              </svg>
              <span>Confirmado!</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ReservationForm;