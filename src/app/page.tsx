'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProcessedJob } from '@/types/job';
import { DashboardStats } from '@/db/repository';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import {
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Building2,
  Briefcase,
  Layers,
  ArrowRight,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentJobs, setRecentJobs] = useState<ProcessedJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);
  const [loading, setLoading] = useState(true);

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
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const approvalRate =
    stats && stats.totalJobs > 0
      ? Math.round((stats.approvedJobs / stats.totalJobs) * 100)
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 glass-panel border border-slate-700/60 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/30">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Painel de Monitoramento & Inteligência de Vagas</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              Olá, Moacir Neto 👋
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              Aqui está o resumo das vagas coletadas autonomamente, filtradas por IA e
              ranqueadas de acordo com seu perfil <strong>Full Stack Júnior</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Atualizar Dados</span>
            </button>
            <Link
              href="/board"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <span>Abrir Kanban Board</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold tracking-wider">Total Coletadas</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats?.totalJobs ?? 0}
            </span>
            <span className="text-xs text-slate-400">vagas históricas</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold tracking-wider">Aprovadas Jr</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {stats?.approvedJobs ?? 0}
            </span>
            <span className="text-xs text-slate-400">compatíveis</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold tracking-wider">Taxa de Aprovação</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-sky-400">{approvalRate}%</span>
            <span className="text-xs text-slate-400">dos anúncios</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase font-bold tracking-wider">Score Médio IA</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-300">
              {stats?.avgScore ?? 0}%
            </span>
            <span className="text-xs text-slate-400">qualidade técnica</span>
          </div>
        </div>
      </div>

      {/* Analytics Breakdown & Top Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Funnel */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>Funil de Candidaturas</span>
            </h3>
            <Link href="/board" className="text-xs text-sky-400 hover:underline">
              Ver Kanban
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { key: 'pending', label: 'Inbox (Pendente)', color: 'bg-slate-500' },
              { key: 'applied', label: 'Candidaturas Enviadas', color: 'bg-sky-500' },
              { key: 'interview', label: 'Em Processo / Entrevista', color: 'bg-amber-500' },
              { key: 'offer', label: 'Propostas Recebidas', color: 'bg-emerald-500' },
              { key: 'rejected', label: 'Descartadas / Finalizadas', color: 'bg-rose-500' },
            ].map((st) => {
              const count = stats?.statusCounts[st.key] ?? 0;
              const total = stats?.totalJobs || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={st.key} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 font-medium">
                    <span>{st.label}</span>
                    <span className="font-bold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div
                      className={`${st.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Categories Distribution */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Distribuição por Categoria</span>
          </h3>

          <div className="space-y-3">
            {stats && Object.keys(stats.categoryCounts).length > 0 ? (
              Object.entries(stats.categoryCounts).map(([cat, count]) => {
                const total = stats.totalJobs || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300 font-medium">
                      <span>{cat}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhuma categoria registrada.</p>
            )}
          </div>
        </div>

        {/* Top Hiring Companies */}
        <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>Top Empresas Anunciando</span>
          </h3>

          <div className="space-y-2.5">
            {stats && stats.topCompanies.length > 0 ? (
              stats.topCompanies.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs"
                >
                  <span className="font-medium text-slate-200 truncate max-w-[180px]">
                    {c.company}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
                    {c.count} {c.count === 1 ? 'vaga' : 'vagas'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">Nenhuma empresa mapeada.</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent High Match Jobs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <span>Vagas com Maior Match Recentes</span>
            </h2>
            <p className="text-xs text-slate-400">
              Vagas aprovadas pelo algoritmo de IA com score de senioridade e stack
            </p>
          </div>
          <Link
            href="/jobs"
            className="text-xs md:text-sm font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 hover:underline"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 glass-panel rounded-2xl">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-400" />
            <span>Carregando vagas recomendadas...</span>
          </div>
        ) : recentJobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {recentJobs.map((job) => (
              <JobCard key={job.id} job={job} onSelect={(j: ProcessedJob) => setSelectedJob(j)} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 glass-panel rounded-2xl">
            <p>Nenhuma vaga compatível encontrada recentemente.</p>
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
