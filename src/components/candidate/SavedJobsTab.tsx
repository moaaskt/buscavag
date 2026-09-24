'use client';

import React from 'react';
import {
  Bookmark,
  MapPin,
  Clock,
  Trash2,
  Sparkles,
  ExternalLink,
  Loader2,
  Target,
} from 'lucide-react';
import { SavedJob } from './types';
import { PlatformBadge } from '@/components/ui/PlatformBadge';
import { ScoreBadge } from '@/components/ScoreBadge';

interface SavedJobsTabProps {
  savedJobs: SavedJob[];
  loadingJobs: boolean;
  onRemoveJob: (jobId: string, currentStatus: string) => void;
  onOpenModal: (job: any) => void;
  onGoToRecommended: () => void;
}

export function SavedJobsTab({
  savedJobs,
  loadingJobs,
  onRemoveJob,
  onOpenModal,
  onGoToRecommended,
}: SavedJobsTabProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 md:p-8 shadow-xs">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Vagas Salvas
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Gerencie as oportunidades de seu interesse favoritadas durante suas buscas.
          </p>
        </div>

        <button
          type="button"
          onClick={onGoToRecommended}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors self-start md:self-auto shadow-2xs"
        >
          <span>Explorar Vagas Recomendadas</span>
          <Target className="w-3.5 h-3.5" />
        </button>
      </div>

      {loadingJobs ? (
        <div className="py-16 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
          <span>Carregando vagas salvas...</span>
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="py-16 text-center border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 p-8">
          <Bookmark className="w-10 h-10 text-zinc-400 mx-auto mb-2.5" />
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Nenhuma vaga salva no momento
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
            Navegue pelas Vagas Recomendadas e clique em &quot;Salvar Vaga&quot; para acompanhar suas oportunidades selecionadas por aqui.
          </p>
          <button
            type="button"
            onClick={onGoToRecommended}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-2xs"
          >
            Ver Vagas Recomendadas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedJobs.map((item) => {
            const score = item.job.score_ia || item.job.overall_score || 0;
            const publishedDate = item.job.published_at
              ? new Date(item.job.published_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })
              : null;

            return (
              <div
                key={item.job_id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <PlatformBadge platform={item.job.platform} />
                    <button
                      type="button"
                      onClick={() => onRemoveJob(item.job_id, item.status)}
                      aria-label="Remover vaga salva"
                      className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg p-1.5 transition-colors"
                      title="Remover vaga salva"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mt-2.5 line-clamp-2 leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {item.job.title}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 font-medium">{item.job.company}</p>

                  <div className="flex items-center gap-3.5 text-[11px] text-zinc-500 mt-2.5 flex-wrap">
                    {item.job.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[150px]">{item.job.location}</span>
                      </div>
                    )}
                    {publishedDate && (
                      <div className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span>{publishedDate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 flex-wrap">
                  <ScoreBadge score={score} size="sm" shape="rect" />

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenModal(item.job)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Pitch & Detalhes</span>
                    </button>

                    <a
                      href={item.job.url}
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
          })}
        </div>
      )}
    </div>
  );
}
