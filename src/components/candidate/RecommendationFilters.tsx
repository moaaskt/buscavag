'use client';

import React from 'react';
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react';

interface RecommendationFiltersProps {
  minScoreFilter: number;
  onMinScoreChange: (score: number) => void;
  searchRec: string;
  onSearchChange: (search: string) => void;
  workModelRec: string;
  onWorkModelChange: (model: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function RecommendationFilters({
  minScoreFilter,
  onMinScoreChange,
  searchRec,
  onSearchChange,
  workModelRec,
  onWorkModelChange,
  onRefresh,
  loading,
}: RecommendationFiltersProps) {
  const scoreOptions = [
    { label: 'Todos', val: 0 },
    { label: '≥ 50% Bom', val: 50 },
    { label: '≥ 70% Alto', val: 70 },
    { label: '≥ 85% Super Match', val: 85 },
  ];

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
      {/* Botões de Score */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-zinc-500 font-medium mr-1 flex items-center gap-1 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Match:</span>
        </span>
        {scoreOptions.map((f) => {
          const isActive = minScoreFilter === f.val;
          return (
            <button
              key={f.val}
              type="button"
              onClick={() => onMinScoreChange(f.val)}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Busca, Modalidade e Refresh */}
      <div className="flex items-center gap-2 flex-1 md:max-w-md justify-end">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchRec}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onRefresh()}
            placeholder="Filtrar por tecnologia..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
          />
        </div>

        <select
          value={workModelRec}
          onChange={(e) => onWorkModelChange(e.target.value)}
          aria-label="Filtrar por modalidade"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-2.5 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors cursor-pointer shrink-0"
        >
          <option value="">Modalidade</option>
          <option value="remoto">Remoto</option>
          <option value="presencial">Presencial</option>
        </select>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Atualizar recomendações"
          className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shrink-0 disabled:opacity-50"
          title="Atualizar Recomendações"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600 dark:text-emerald-400' : ''}`} />
        </button>
      </div>
    </div>
  );
}
