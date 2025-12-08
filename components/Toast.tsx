import React, { useEffect } from 'react';
import { CheckIcon, XIcon } from './icons';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'success', isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <div 
        className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl transition-all duration-300 z-50 flex items-center gap-3 border ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
            type === 'success' 
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-800' 
                : 'bg-red-600 text-white border-red-700'
        }`}
    >
        {type === 'success' ? (
            <CheckIcon className="w-5 h-5 text-green-400 dark:text-green-600" />
        ) : (
            <div className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20">!</div>
        )}
        <span className="font-medium text-sm">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
            <XIcon className="w-4 h-4" />
        </button>
    </div>
  );
};

export default Toast;