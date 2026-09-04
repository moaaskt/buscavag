'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Zap, X } from 'lucide-react';

interface SyncPayload {
  success: boolean;
  title?: string;
  newJobsCount?: number;
  message?: string;
}

export function SyncToast() {
  const [toast, setToast] = useState<SyncPayload | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleSyncDone = (e: Event) => {
      const payload = (e as CustomEvent<SyncPayload>).detail;
      setToast(payload);
      setVisible(true);
    };

    const handlePurgeDone = (e: Event) => {
      const payload = (e as CustomEvent<SyncPayload>).detail;
      setToast(payload);
      setVisible(true);
    };

    window.addEventListener('buscavag:sync-done', handleSyncDone);
    window.addEventListener('buscavag:purge-done', handlePurgeDone);

    return () => {
      window.removeEventListener('buscavag:sync-done', handleSyncDone);
      window.removeEventListener('buscavag:purge-done', handlePurgeDone);
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [visible, toast]);

  return (
    <AnimatePresence>
      {visible && toast && (
        <motion.div
          key="sync-toast"
          initial={{ opacity: 0, y: -24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.95 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed top-4 right-4 z-[9999] max-w-xs w-full pointer-events-auto"
        >
          <div
            className={`flex items-start gap-3 rounded-2xl border shadow-2xl px-4 py-3.5 backdrop-blur-md ${
              toast.success
                ? 'bg-zinc-950/95 border-emerald-700/60 text-zinc-100'
                : 'bg-zinc-950/95 border-rose-700/60 text-zinc-100'
            }`}
          >
            {/* Icon */}
            <div className="shrink-0 mt-0.5">
              {toast.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">
                {toast.title || (toast.success ? 'Sincronização iniciada!' : 'Falha na operação')}
              </p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 leading-snug">
                {toast.message || (toast.success ? 'Operação executada com sucesso.' : 'Ocorreu um erro ao processar a requisição.')}
              </p>
              {toast.success && !toast.title && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Zap className="w-3 h-3 text-emerald-500" />
                  <span className="text-[11px] font-mono text-emerald-400">
                    Os dados serão atualizados automaticamente
                  </span>
                </div>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setVisible(false)}
              type="button"
              className="shrink-0 p-0.5 rounded-md text-zinc-500 hover:text-zinc-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress bar auto-dismiss */}
          {toast.success && (
            <motion.div
              className="absolute bottom-0 left-0 h-0.5 bg-emerald-500/60 rounded-full"
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 5, ease: 'linear' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
