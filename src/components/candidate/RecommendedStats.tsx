'use client';

import React from 'react';
import { MatchStatsData } from './types';

interface RecommendedStatsProps {
  matchStats: MatchStatsData | null;
}

export function RecommendedStats({ matchStats }: RecommendedStatsProps) {
  if (!matchStats || matchStats.totalAnalyzed === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-4 shadow-xs">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Aderência Média</span>
        <div className="mt-1 text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
          {matchStats.avgScore}%
        </div>
        <p className="text-[11px] text-zinc-500 mt-1">
          Com base em {matchStats.totalAnalyzed} vagas recentes
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-4 shadow-xs">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Super Match (≥ 75%)</span>
        <div className="mt-1 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
          {matchStats.highMatchCount} <span className="text-xs font-normal font-sans text-zinc-500">vagas</span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-1">
          Alta afinidade com sua stack e experiência
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-4 shadow-xs">
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Top Competências em Demanda</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {matchStats.topMatchedSkills.slice(0, 3).map((s) => (
            <span
              key={s.skill}
              className="rounded-md border border-zinc-200 dark:border-zinc-700/60 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
            >
              {s.skill} ({s.count})
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
