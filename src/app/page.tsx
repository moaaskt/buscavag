'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProcessedJob } from '@/types/job';
import { DashboardStats } from '@/db/repository';
import { JobModal } from '@/components/JobModal';
import {
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal,
  BarChart3,
  ChevronRight,
  Building2,
  MapPin,
  Calendar,
  Layers2,
  Compass,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<ProcessedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, jobsRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/jobs?onlyApproved=true'),
      ]);

      const statsData = await statsRes.json();
      const jobsData = await jobsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (jobsData.success) setRecentJobs(jobsData.data.slice(0, 5));
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        if (selectedJob && selectedJob.id === id) {
          setSelectedJob({
            ...selectedJob,
            applicationStatus: newStatus as any,
          });
        }
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const totalJobs = stats?.totalJobs ?? 0;
  const approvedJobs = stats?.approvedJobs ?? 0;
  const discardedJobs = Math.max(0, totalJobs - approvedJobs);
  const approvalRate =
    totalJobs > 0 ? Math.round((approvedJobs / totalJobs) * 100) : 0;
  const avgScore = stats?.avgScore ?? 0;

  // Active platform sources count
  const activeSourcesCount = stats?.platformCounts && Object.keys(stats.platformCounts).length > 0
    ? Object.keys(stats.platformCounts).length
    : (loading ? '-' : 0);

  // Highest match job for Top Match indicator
  const topMatchJob = recentJobs.length > 0 ? recentJobs[0] : null;
  const topMatchScore = topMatchJob ? (topMatchJob.overallScore ?? topMatchJob.scoreIa ?? 0) : 0;
  const topMatchLabel = topMatchJob
    ? `${topMatchScore}% (${topMatchJob.category || 'Tech'})`
    : (loading ? 'Carregando...' : 'Nenhum match');

  // Status Funnel items
  const funnelItems = [
    {
      key: 'pending',
      label: 'Inbox / Pendente',
      barColor: 'bg-zinc-400 dark:bg-zinc-400',
      textColor: 'text-zinc-400',
    },
    {
      key: 'applied',
      label: 'Candidaturas Enviadas',
      barColor: 'bg-emerald-500 dark:bg-emerald-400',
      textColor: 'text-emerald-500 dark:text-emerald-400',
    },
    {
      key: 'interview',
      label: 'Em Processo / Entrevista',
      barColor: 'bg-amber-500 dark:bg-amber-400',
      textColor: 'text-amber-500 dark:text-amber-400',
    },
    {
      key: 'offer',
      label: 'Propostas Recebidas',
      barColor: 'bg-teal-500 dark:bg-teal-400',
      textColor: 'text-teal-500 dark:text-teal-400',
    },
    {
      key: 'rejected',
      label: 'Descartadas',
      barColor: 'bg-zinc-600 dark:bg-zinc-600',
      textColor: 'text-zinc-500',
    },
  ];

  // Daily quota helper
  const appliedCount = stats?.statusCounts?.applied ?? 0;

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300">
      {/* Top Bar & Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Painel Operacional
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
              Sync Ativo
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Olá, Moacir Neto
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Resumo das vagas coletadas autonomamente, avaliadas por aderência técnica ao seu perfil{' '}
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">Full Stack Júnior & Automação IoT</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            onClick={handleRefresh}
            disabled={loading || refreshing}
            type="button"
            className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2 text-xs md:text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${refreshing || loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Dados</span>
          </button>
          <Link
            href="/board"
            className="h-9 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-100 dark:text-zinc-900 text-xs md:text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
          >
            <span>Abrir Kanban Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4 Metric KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-zinc-900/70 rounded-xl p-4 md:p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Total Coletadas
            </span>
            <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {totalJobs}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">vagas históricas</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/50">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{activeSourcesCount} fontes</span>
            <span>rastreadas</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-zinc-900/70 rounded-xl p-4 md:p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Aprovadas Júnior
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Match Ativo
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {approvedJobs}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">compatíveis</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/50">
            <span>Triagem automática</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">Entry/Jr</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-zinc-900/70 rounded-xl p-4 md:p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Taxa de Aprovação
            </span>
            <SlidersHorizontal className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {approvalRate}%
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">dos anúncios</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/50">
            <span>{discardedJobs} descartes</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-zinc-900/70 rounded-xl p-4 md:p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Score de Adequação
            </span>
            <BarChart3 className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              {avgScore}%
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">média geral</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/50 truncate">
            <span>Top:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium truncate">
              {topMatchLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: 3 Analytical Blocks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5">
        {/* Bloco 1: Funil de Candidaturas (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900/70 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Funil de Candidaturas
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fluxo pelo pipeline operacional
              </p>
            </div>
            <Link
              href="/board"
              className="font-mono text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 flex items-center gap-1 transition-colors"
            >
              <span>Ver Kanban</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            {funnelItems.map((item) => {
              const count = stats?.statusCounts?.[item.key] ?? 0;
              const pct = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
              return (
                <div key={item.key} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300">{item.label}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      <span className={item.textColor}>{count}</span>{' '}
                      <span className="text-zinc-400 dark:text-zinc-600">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span>Capacidade diária recomendada</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-medium">
              {appliedCount} / 25 aplicadas
            </span>
          </div>
        </div>

        {/* Bloco 2: Distribuição por Categoria (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900/70 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Distribuição por Categoria
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Segmentação de papéis mapeados
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1">
            {stats && Object.keys(stats.categoryCounts).length > 0 ? (
              Object.entries(stats.categoryCounts).map(([category, count], idx) => {
                const pct = totalJobs > 0 ? Math.round((count / totalJobs) * 100) : 0;
                const barColors = [
                  'bg-zinc-300 dark:bg-zinc-200',
                  'bg-emerald-500 dark:bg-emerald-400',
                  'bg-indigo-500 dark:bg-indigo-400',
                  'bg-amber-500 dark:bg-amber-400',
                  'bg-purple-500 dark:bg-purple-400',
                ];
                const barColor = barColors[idx % barColors.length];

                return (
                  <div key={category} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {category}
                      </span>
                      <span className="text-zinc-900 dark:text-zinc-100 font-semibold">
                        {count} {count === 1 ? 'vaga' : 'vagas'}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">
                Nenhuma categoria registrada ainda.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span>Foco prioritário</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              React • Node • IoT
            </span>
          </div>
        </div>

        {/* Bloco 3: Top Empresas Anunciando (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-zinc-900/70 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Top Empresas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Volume de vagas ativas
            </p>
          </div>

          <div className="flex flex-col gap-1.5 pt-1 divide-y divide-zinc-100 dark:divide-zinc-800/40">
            {stats && stats.topCompanies.length > 0 ? (
              stats.topCompanies.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-1.5 text-xs first:pt-0 last:pb-0"
                >
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium truncate max-w-[140px]">
                    {c.company}
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                    {c.count} {c.count === 1 ? 'vaga' : 'vagas'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-500 py-6 text-center">
                Nenhuma empresa mapeada ainda.
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span>Agregadores & Diretas</span>
            <span className="text-zinc-800 dark:text-zinc-200">
              {stats?.topCompanies?.length ?? 0} principais
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Vagas com Maior Match Recentes */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Vagas com Maior Match Recentes
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400">
              Classificação refinada com base no stack declarada e nível de senioridade
            </p>
          </div>
          <Link
            href="/jobs"
            className="font-mono text-xs text-zinc-700 dark:text-zinc-300 hover:text-emerald-500 dark:hover:text-emerald-400 flex items-center gap-1 transition-colors"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Dense Minimalist Job Cards List */}
        {loading ? (
          <div className="p-10 text-center text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-zinc-400" />
            <span className="text-xs font-mono">Carregando vagas recomendadas...</span>
          </div>
        ) : recentJobs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {recentJobs.map((job) => {
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
              const st = statusMap[job.applicationStatus || 'pending'] || statusMap.pending;

              return (
                <div
                  key={job.id}
                  onClick={() => setSelectedJob(job)}
                  className="group cursor-pointer bg-white dark:bg-zinc-900/70 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all rounded-xl p-4 border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-2.5"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left details */}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="text-sm md:text-base font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                          {job.title}
                        </span>
                        {/* Clean platform tag in neutral tone */}
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 uppercase">
                          {job.platform}
                        </span>
                        {/* Category tag */}
                        {job.category && (
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60">
                            {job.category}
                          </span>
                        )}
                        {/* Minimalist status with subtle dot */}
                        <span className="font-mono text-[11px] flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 pl-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
                          <span>{st.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                          {job.company}
                        </span>
                        <span>•</span>
                        <span>{job.location || 'Remoto'}</span>
                        <span>•</span>
                        <span>{publishedStr}</span>
                      </div>
                    </div>

                    {/* Right: Clean score and chevron */}
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
                    <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800/40">
                      <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                        {job.aiReasoning}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
            <p className="text-xs font-mono">Nenhuma vaga compatível encontrada recentemente.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Vaga */}
      <JobModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
