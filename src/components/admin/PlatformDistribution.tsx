'use client';

import React from 'react';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import { BarChart3 } from 'lucide-react';

interface PlatformDistributionProps {
  platformCounts: Record<string, number>;
}

export function PlatformDistribution({ platformCounts }: PlatformDistributionProps) {
  const entries = Object.entries(platformCounts)
    .sort(([, a], [, b]) => b - a);

  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const maxCount = entries.length > 0 ? entries[0][1] : 1;

  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
        Nenhuma fonte mapeada ainda.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
            Distribuição por Fonte
          </h3>
        </div>
        <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
          {entries.length} fontes · {total.toLocaleString('pt-BR')} vagas
        </span>
      </div>

      {/* Distribution List */}
      <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
        {entries.map(([platform, count]) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;

          return (
            <div key={platform} className="group">
              <div className="flex items-center justify-between gap-3 mb-1">
                <PlatformBadge platform={platform} />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {count.toLocaleString('pt-BR')}
                  </span>
                  <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 w-[42px] text-right">
                    {percentage}%
                  </span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800/80 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-500 dark:to-teal-500 group-hover:from-emerald-400 group-hover:to-teal-300"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
