import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <div
      className={`fixed bottom-5 left-1/2 -translate-x-1/2 transition-transform duration-300 ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      } bg-[#2E8B57] text-white px-6 py-3 rounded-2xl shadow-lg flex items-center z-50`}
    >
      <span className="mr-2 text-xl">💊</span> {message}
    </div>
  );
};

export default Toast;