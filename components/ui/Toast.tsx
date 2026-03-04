import React, { useEffect } from 'react';
import { ToastMessage } from '../../types';

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} removeToast={removeToast} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; removeToast: (id: string) => void }> = ({ toast, removeToast }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      removeToast(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, removeToast]);

  const bgColors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  };

  const getIcon = () => {
    if (toast.type === 'success') {
      return (
        <div className="bg-white/20 rounded-full p-1 w-6 h-6 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" className="checkmark-path" />
            </svg>
        </div>
      );
    }
    if (toast.type === 'error') return <span>⚠️</span>;
    return <span>ℹ️</span>;
  };

  return (
    <div className={`${bgColors[toast.type]} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 min-w-[300px] animate-fade-in-up pointer-events-auto border border-white/10 backdrop-blur-sm`}>
      {getIcon()}
      <span className="flex-1 font-medium text-sm">{toast.message}</span>
      <button onClick={() => removeToast(toast.id)} className="text-white/60 hover:text-white transition font-bold text-lg leading-none">
        &times;
      </button>
    </div>
  );
};