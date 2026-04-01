import React from 'react';
import { Cancel01Icon as X } from 'hugeicons-react';

interface ContextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function ContextPanel({ isOpen, onClose, title, children }: ContextPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-[#191919] border-l border-white/10 h-screen flex flex-col shadow-xl z-50 absolute right-0 top-0 lg:relative lg:shadow-none">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <h3 className="font-semibold text-white/90">{title}</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-md text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {children}
      </div>
    </div>
  );
}
