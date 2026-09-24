'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  Bell,
  Menu,
  CheckCircle2,
} from 'lucide-react';

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  adminUser?: {
    name: string;
    email: string;
    totp_enabled?: boolean;
  } | null;
}

export function AdminHeader({ onToggleSidebar, adminUser }: AdminHeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-[#1f2430] border-b border-[#e9ebec] dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Console Administrativo
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <CheckCircle2 className="w-3 h-3" />
            Produção Operacional
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* 2FA Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
          {adminUser?.totp_enabled ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">2FA Ativado</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-500 dark:text-slate-400">2FA Opcional</span>
            </>
          )}
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-700/60">
          <div className="w-8 h-8 rounded-full bg-[#405189]/10 text-[#405189] dark:bg-[#405189]/20 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
              {adminUser?.name || 'Administrador'}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[140px]">
              {adminUser?.email || 'admin@buscavag.com.br'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
            title="Sair da sessão administrativa"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
