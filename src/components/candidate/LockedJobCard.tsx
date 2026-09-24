'use client';

import React from 'react';
import { Crown, Lock } from 'lucide-react';
import { RecommendedJobItem } from './types';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import { ScoreBadge } from '@/components/ScoreBadge';

interface LockedJobCardProps {
  item: RecommendedJobItem;
  onUpgradeClick: () => void;
}

export function LockedJobCard({ item, onUpgradeClick }: LockedJobCardProps) {
  const { job, match } = item;

  return (
    <div className="relative rounded-xl border border-amber-500/30 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Header Bloqueado */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PlatformBadge platform={job.platform} />
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
              <Crown className="w-2.5 h-2.5 text-amber-500" />
              <span>Plano Pro</span>
            </span>
          </div>
          <ScoreBadge score={match.overallScore} size="sm" shape="rect" />
        </div>

        {/* Título e Empresa com Blur Leve */}
        <div className="mt-3">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
            {job.title}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 select-none blur-[2px] font-mono">
            {job.company} • Remoto / Brasil
          </p>

          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 text-center">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-1.5" />
            <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 block">
              Oportunidade com {match.overallScore}% de Aderência
            </span>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
              Desbloqueie acesso completo aos dados da empresa, parecer da IA e links de aplicação com o Plano Pro.
            </p>
          </div>
        </div>
      </div>

      {/* Rodapé CTA */}
      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
        <span className="text-[11px] text-zinc-400 font-mono">
          Vaga #{job.id.slice(0, 8)}
        </span>

        <button
          type="button"
          onClick={onUpgradeClick}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 text-xs transition-colors shadow-2xs"
        >
          <Crown className="w-3.5 h-3.5" />
          <span>Desbloquear Vaga (Pro)</span>
        </button>
      </div>
    </div>
  );
}
