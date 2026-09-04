'use client';

import React from 'react';
import { ProcessedJob } from '@/types/job';
import { ChevronRight, Building2, MapPin, Calendar, Sparkles } from 'lucide-react';

interface JobCardProps {
  job: ProcessedJob;
  onSelect: (job: ProcessedJob) => void;
  compact?: boolean;
}

export function JobCard({ job, onSelect, compact = false }: JobCardProps) {
  const publishedStr = new Date(job.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const score = job.overallScore ?? job.scoreIa ?? 0;

  const statusMap: Record<string, { label: string; dotColor: string }> = {
    pending: { label: 'Inbox', dotColor: 'bg-zinc-400' },
    applied: { label: 'Aplicado', dotColor: 'bg-emerald-500' },
    interview: { label: 'Entrevista', dotColor: 'bg-amber-500' },
    offer: { label: 'Oferta', dotColor: 'bg-teal-500' },
    rejected: { label: 'Descartado', dotColor: 'bg-rose-500' },
  };

  const statusInfo = statusMap[job.applicationStatus || 'pending'] || statusMap.pending;

  if (compact) {
    return (
      <div
        onClick={() => onSelect(job)}
        className="group cursor-pointer bg-white dark:bg-zinc-900/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm transition-all flex flex-col gap-2 w-full min-w-0"
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className="font-mono text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 truncate max-w-[90px]">
            {job.platform}
          </span>
          <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
            {score}%
          </span>
        </div>

        <div className="min-w-0">
          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
            {job.title}
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-1 truncate">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.company}</span>
          </p>
        </div>

        <div className="flex items-center justify-between mt-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 min-w-0">
          <span className="flex items-center gap-1 truncate max-w-[90px]">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{job.location || 'Remoto'}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
            <span>{statusInfo.label}</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(job)}
      className="group cursor-pointer bg-white dark:bg-zinc-900/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm transition-all flex flex-col gap-2.5 w-full min-w-0"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
        {/* Left: Info */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          <div className="flex items-center flex-wrap gap-2 min-w-0">
            <span className="text-sm md:text-base font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
              {job.title}
            </span>
            {/* Neutral platform tag */}
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 uppercase shrink-0">
              {job.platform}
            </span>
            {/* Category tag */}
            {job.category && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 shrink-0">
                {job.category}
              </span>
            )}
            {/* Minimalist status with subtle dot */}
            <span className="font-mono text-[11px] flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 pl-1 shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotColor}`} />
              <span>{statusInfo.label}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium truncate">
              {job.company}
            </span>
            <span>•</span>
            <span className="truncate">{job.location || 'Remoto'}</span>
            <span>•</span>
            <span className="shrink-0">{publishedStr}</span>
          </div>
        </div>

        {/* Right: Scores & Action */}
        <div className="flex items-center gap-4 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100 dark:border-zinc-800/60 justify-between lg:justify-end">
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1.5 font-mono text-xs">
              <span className="text-zinc-400 dark:text-zinc-500">SCORE:</span>
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {score}%
              </span>
            </div>
            {job.stackScore !== undefined && (
              <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                Stack: {job.stackScore}%
              </span>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>

      {/* AI Reasoning snippet */}
      {job.aiReasoning && (
        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/40 flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 truncate">
            {job.aiReasoning}
          </p>
        </div>
      )}
    </div>
  );
}
