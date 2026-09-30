'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface VelzonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function VelzonModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}: VelzonModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-2xs animate-in fade-in duration-200">
      <div
        className={`bg-white dark:bg-[#1f2430] border border-[#e9ebec] dark:border-slate-800 rounded-lg shadow-xl w-full ${maxWidthMap[maxWidth]} overflow-hidden animate-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e9ebec] dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">{children}</div>

        {/* Modal Footer */}
        {footer && (
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#1a1e29] border-t border-[#e9ebec] dark:border-slate-800 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
