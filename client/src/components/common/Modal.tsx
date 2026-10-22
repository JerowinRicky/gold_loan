import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={onClose}
        />

        {/* Modal Box */}
        <div
          className={`inline-block w-full ${maxWidthClass} my-8 text-left align-middle transition-all transform bg-[#FFFDF9] border border-[#DDD5C8] rounded shadow-modal z-10 animate-in zoom-in-95 duration-150`}
        >
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#DDD5C8] bg-[#F8F4ED]">
            <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 text-charcoal-secondary hover:text-ferrari hover:bg-[#EADCC8] rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 max-h-[85vh] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
};

