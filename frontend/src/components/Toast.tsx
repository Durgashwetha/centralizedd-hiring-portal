import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'success',
  onClose,
  duration = 4000
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  const bgStyles = {
    success: 'bg-[#1C2333] border-emerald-500/40 text-white shadow-2xl',
    error: 'bg-[#1C2333] border-rose-500/40 text-white shadow-2xl',
    info: 'bg-[#1C2333] border-blue-500/40 text-white shadow-2xl'
  };

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-rose-400',
    info: 'text-blue-400'
  };

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-md w-full px-4">
      <div className={`rounded-2xl p-4 border backdrop-blur-xl flex items-center justify-between gap-3 ${bgStyles[type]}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-xl bg-white/10 ${iconColors[type]}`}>
            {type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {type === 'error' && <AlertCircle className="w-5 h-5" />}
            {type === 'info' && <Info className="w-5 h-5" />}
          </div>
          <p className="text-xs font-semibold leading-relaxed truncate-2-lines">
            {message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
