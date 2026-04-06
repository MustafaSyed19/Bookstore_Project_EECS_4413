import { useEffect } from 'react';
import { Icon, ICONS } from './Icons';

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <Icon d={type === 'success' ? ICONS.check : ICONS.x} size={16} color="white" />
      {message}
    </div>
  );
}
