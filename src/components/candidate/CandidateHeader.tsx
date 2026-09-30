'use client';

import React from 'react';
import { User, Crown, LogOut } from 'lucide-react';
import { UserData } from './types';

interface CandidateHeaderProps {
  user: UserData;
  onUpgradeClick: () => void;
  onLogout: () => void;
}

export function CandidateHeader({
  user,
  onUpgradeClick,
  onLogout,
}: CandidateHeaderProps) {
  const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-lg border border-zinc-200 dark:border-zinc-700/60 shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                {user.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  user.tier === 'premium'
                    ? 'border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400'
                    : 'border border-zinc-200 dark:border-zinc-700/60 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {user.tier === 'premium' ? (
                  <>
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>Premium Pro</span>
                  </>
                ) : (
                  <span>Plano Free</span>
                )}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
              {user.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          {user.tier === 'free' ? (
            <button
              type="button"
              onClick={onUpgradeClick}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-2 text-xs transition-colors shadow-xs"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Fazer Upgrade Pro</span>
            </button>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700 dark:text-amber-300 font-medium">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>Assinatura Ativa</span>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            aria-label="Encerrar sessão"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900/40 hover:bg-rose-50/40 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sair</span>
          </button>
        </div>
      </div>
    </div>
  );
}
