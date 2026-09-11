'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CheckCircle2, Clock, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FloatingActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onUpdateStatusSelected: (status: string) => void;
  isDeleting?: boolean;
}

export function FloatingActionBar({
  selectedCount,
  onClearSelection,
  onDeleteSelected,
  onUpdateStatusSelected,
  isDeleting = false,
}: FloatingActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto bg-zinc-900/95 dark:bg-zinc-950/95 text-zinc-100 backdrop-blur-md border border-zinc-800 dark:border-zinc-800/90 shadow-2xl rounded-2xl px-4 py-3 flex items-center gap-3 md:gap-4 max-w-xl w-full justify-between">
            {/* Counter & Clear */}
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center bg-emerald-500/20 text-emerald-400 font-mono text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                {selectedCount}
              </span>
              <span className="text-xs md:text-sm font-medium text-zinc-200 truncate">
                {selectedCount === 1 ? 'vaga selecionada' : 'vagas selecionadas'}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Dropdown de Status em Lote */}
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 px-2.5 md:px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-zinc-700/60 focus:outline-none">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Mudar Status</span>
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-200 text-xs">
                  <DropdownMenuItem onClick={() => onUpdateStatusSelected('pending')} className="cursor-pointer hover:bg-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 mr-2" />
                    Marcar como Inbox
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatusSelected('applied')} className="cursor-pointer hover:bg-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                    Marcar como Aplicado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatusSelected('interview')} className="cursor-pointer hover:bg-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                    Marcar como Em Entrevista
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatusSelected('offer')} className="cursor-pointer hover:bg-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-teal-500 mr-2" />
                    Marcar como Oferta Recebida
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatusSelected('rejected')} className="cursor-pointer hover:bg-zinc-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500 mr-2" />
                    Marcar como Descartado
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Botão de Excluir Selecionadas */}
              <button
                onClick={onDeleteSelected}
                disabled={isDeleting}
                type="button"
                className="h-8 px-2.5 md:px-3 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excluir</span>
              </button>

              <div className="w-[1px] h-5 bg-zinc-800 mx-0.5" />

              {/* Cancelar Seleção */}
              <button
                onClick={onClearSelection}
                type="button"
                title="Desmarcar todas"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
