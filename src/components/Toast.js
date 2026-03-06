import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 5000 }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Small delay to trigger entry animation
    requestAnimationFrame(() => setIsVisible(true));

    const autoClose = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for exit animation before unmounting
    }, duration);

    return () => clearTimeout(autoClose);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getStyle = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
        };
      case 'error':
        return {
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/20',
          icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
        };
      default:
        return {
          bg: 'bg-primary/10',
          border: 'border-primary/20',
          icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${style.bg} ${style.border}`}
    >
      {style.icon}
      <p className="text-sm font-medium pr-4">{message}</p>
      <button
        onClick={handleClose}
        className="p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
