'use client';

import React from 'react';
import { MapPin, Clock, Bookmark, Sparkles, ExternalLink, Check } from 'lucide-react';
import { RecommendedJobItem } from './types';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import { ScoreBadge } from '@/components/ScoreBadge';

interface CandidateJobCardProps {
  item: RecommendedJobItem;
  onSaveToggle: (jobId: string) => void;
  onOpenModal: (item: RecommendedJobItem) => void;
}

export function CandidateJobCard({
  item,
  onSaveToggle,
  onOpenModal,
}: CandidateJobCardProps) {
  const { job, match, isSaved } = item;

  const publishedDate = job.published_at
    ? new Date(job.published_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 md:p-6 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between group">
      <div>
        {/* Top Header: Origem, Afinidade e Score */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PlatformBadge platform={job.platform} />
            {match.isStrongMatch && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-2.5 h-2.5" />
                <span>Alta Afinidade</span>
              </span>
            )}
          </div>
          <ScoreBadge score={match.overallScore} size="sm" shape="rect" />
        </div>

        {/* Título da Vaga e Empresa */}
        <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-snug">
          {job.title}
        </h3>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">{job.company}</p>

        {/* Metadados: Localização e Data */}
        <div className="flex items-center gap-3.5 text-[11px] text-zinc-500 mt-2.5 flex-wrap">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate max-w-[160px]">{job.location}</span>
            </div>
          )}
          {publishedDate && (
            <div className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{publishedDate}</span>
            </div>
          )}
        </div>

        {/* Seção Editorial de Compatibilidade */}
        {match.matchReasoning && (
          <div className="mt-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60 p-3 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 block mb-1 text-[11px]">
              Por que combina com seu perfil:
            </span>
            <p className="text-[12px]">{match.matchReasoning}</p>
          </div>
        )}

        {/* Competências Atendidas */}
        {match.matchedSkills.length > 0 && (
          <div className="mt-3">
            <div className="text-[11px] font-medium text-zinc-500 mb-1.5 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Habilidades atendidas ({match.matchedSkills.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.matchedSkills.map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Requisitos Adicionais */}
        {match.missingSkills.length > 0 && (
          <div className="mt-2.5">
            <div className="text-[11px] text-zinc-500 mb-1.5">
              Requisitos adicionais identificados:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {match.missingSkills.slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="rounded-md border border-zinc-200/60 dark:border-zinc-800/60 bg-transparent px-1.5 py-0.5 text-[10px] font-mono text-zinc-500"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ações do Card */}
      <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onSaveToggle(job.id)}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            isSaved
              ? 'border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}`} />
          <span>{isSaved ? 'Salva' : 'Salvar Vaga'}</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenModal(item)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span>Pitch & Detalhes</span>
          </button>

          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 font-medium px-3.5 py-1.5 text-xs transition-colors shadow-2xs"
          >
            <span>Acessar</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
