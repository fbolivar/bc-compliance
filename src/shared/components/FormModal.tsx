'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function FormModal({ isOpen, onClose, title, children }: FormModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-[fadeIn_0.15s_ease-out] max-h-[90vh] sm:max-h-[85vh] sm:mx-4 flex flex-col">
        <div className="relative flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-800 bg-slate-800/40 shrink-0">
          {/* Mobile drag indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-700 rounded-full sm:hidden" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-100 pt-1 sm:pt-0">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-4 sm:px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
