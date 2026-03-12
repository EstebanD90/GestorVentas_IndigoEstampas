import React, { useEffect } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border animate-in slide-in-from-right duration-300 ${
      type === 'success' 
        ? 'bg-green-600 text-white border-green-500' 
        : 'bg-red-600 text-white border-red-500'
    }`}>
      {type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
      <p className="font-bold">{message}</p>
    </div>
  );
};
