'use client';

import React from 'react';
import { Crown, AlertCircle, Target, Loader2, FileText } from 'lucide-react';
import { UserData, RecommendedJobItem, MatchStatsData } from './types';
import { RecommendedStats } from './RecommendedStats';
import { RecommendationFilters } from './RecommendationFilters';
import { CandidateJobCard } from './CandidateJobCard';
import { LockedJobCard } from './LockedJobCard';

interface RecommendedTabProps {
  user: UserData | null;
  recommendedJobs: RecommendedJobItem[];
  loadingRecommended: boolean;
  minScoreFilter: number;
  onMinScoreChange: (score: number) => void;
  searchRec: string;
  onSearchChange: (search: string) => void;
  workModelRec: string;
  onWorkModelChange: (model: string) => void;
  onRefresh: () => void;
  matchStats: MatchStatsData | null;
  onboardingRequired: boolean;
  onUpgradeClick: () => void;
  onSaveToggle: (jobId: string) => void;
  onOpenModal: (item: RecommendedJobItem) => void;
  onGoToProfile: () => void;
  onGoToResume: () => void;
}

export function RecommendedTab({
  user,
  recommendedJobs,
  loadingRecommended,
  minScoreFilter,
  onMinScoreChange,
  searchRec,
  onSearchChange,
  workModelRec,
  onWorkModelChange,
  onRefresh,
  matchStats,
  onboardingRequired,
  onUpgradeClick,
  onSaveToggle,
  onOpenModal,
  onGoToProfile,
  onGoToResume,
}: RecommendedTabProps) {
  return (
    <div className="space-y-6">
      {/* Banner de Upgrade para Plano Free */}
      {user?.tier === 'free' && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Você está no Plano Free (5 melhores oportunidades liberadas)
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Desbloqueie todas as recomendações de vagas compatíveis e alertas em tempo real com o Plano Pro.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpgradeClick}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 text-xs transition-colors shadow-2xs shrink-0 self-start sm:self-auto"
          >
            Fazer Upgrade Pro
          </button>
        </div>
      )}

      {/* Onboarding Incompleto */}
      {onboardingRequired ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8 text-center max-w-lg mx-auto shadow-xs">
          <div className="h-12 w-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 mx-auto mb-3">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1.5">
            Perfil Incompleto para Recomendações
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
            Para calcular seu nível de compatibilidade com alta precisão, informe sua stack técnica, cargo desejado e nível de senioridade ou faça upload do seu currículo.
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={onGoToResume}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 text-xs transition-colors shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Analisar Currículo</span>
            </button>
            <button
              type="button"
              onClick={onGoToProfile}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors"
            >
              Preencher Perfil Manualmente
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Estatísticas de Match */}
          <RecommendedStats matchStats={matchStats} />

          {/* Barra de Filtros */}
          <RecommendationFilters
            minScoreFilter={minScoreFilter}
            onMinScoreChange={onMinScoreChange}
            searchRec={searchRec}
            onSearchChange={onSearchChange}
            workModelRec={workModelRec}
            onWorkModelChange={onWorkModelChange}
            onRefresh={onRefresh}
            loading={loadingRecommended}
          />

          {/* Lista de Vagas */}
          {loadingRecommended ? (
            <div className="py-20 text-center text-zinc-500 font-mono text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
              <span>Calculando afinidade e recomendando vagas...</span>
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="py-14 text-center border border-zinc-200 dark:border-zinc-800/80 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 p-6">
              <Target className="w-10 h-10 text-zinc-400 mx-auto mb-2.5" />
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Nenhuma vaga recomendada para os filtros selecionados
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Tente diminuir a nota de corte de match ou adicione mais tecnologias no seu perfil profissional para expandir as oportunidades.
              </p>
              <div className="mt-4 flex justify-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onMinScoreChange(0);
                    onSearchChange('');
                    onWorkModelChange('');
                  }}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
                >
                  Limpar Filtros
                </button>
                <button
                  type="button"
                  onClick={onGoToProfile}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 text-xs transition-colors shadow-2xs"
                >
                  Editar Perfil
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedJobs.map((item) => {
                if (item.isLocked) {
                  return (
                    <LockedJobCard
                      key={item.job.id}
                      item={item}
                      onUpgradeClick={onUpgradeClick}
                    />
                  );
                }
                return (
                  <CandidateJobCard
                    key={item.job.id}
                    item={item}
                    onSaveToggle={onSaveToggle}
                    onOpenModal={onOpenModal}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
