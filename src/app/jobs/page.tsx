'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ProcessedJob } from '@/types/job';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import {
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Briefcase,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<ProcessedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [minScore, setMinScore] = useState(0);
  const [onlyApproved, setOnlyApproved] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (platform !== 'all') params.set('platform', platform);
      if (category !== 'all') params.set('category', category);
      if (status !== 'all') params.set('status', status);
      if (minScore > 0) params.set('minScore', minScore.toString());
      if (onlyApproved) params.set('onlyApproved', 'true');

      const res = await fetch(`/api/jobs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Erro ao buscar vagas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [platform, category, status, minScore, onlyApproved]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs();
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
        setJobs((prev) =>
          prev.map((j) =>
            j.id === id ? { ...j, applicationStatus: newStatus as any } : j
          )
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setPlatform('all');
    setCategory('all');
    setStatus('all');
    setMinScore(0);
    setOnlyApproved(false);
  };

  const hasActiveFilters =
    search || platform !== 'all' || category !== 'all' || status !== 'all' || minScore > 0 || onlyApproved;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-indigo-400" />
            <span>Explorador Inteligente de Vagas</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Filtre por pontuação de compatibilidade da IA, tecnologia, modelo de trabalho e plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="p-5 rounded-2xl glass-panel border border-slate-800 space-y-4">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cargo (ex: Full Stack, React, Node), empresa ou tecnologia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20"
          >
            Buscar
          </button>
        </form>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 text-xs">
          {/* Platform */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Plataforma:</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Todas as Fontes</option>
              <option value="programathor">Programathor</option>
              <option value="remotar">Remotar</option>
              <option value="catho">Catho</option>
              <option value="glassdoor">Glassdoor</option>
              <option value="linkedin">LinkedIn</option>
              <option value="gupy">Gupy</option>
              <option value="indeed">Indeed</option>
              <option value="google_jobs">Google Jobs</option>
              <option value="telegram">Telegram</option>
            </select>
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Categoria:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Full Stack">Full Stack</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Mobile">Mobile</option>
              <option value="DevOps">DevOps</option>
              <option value="Data">Data</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Status Candidatura:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Inbox (Pendente)</option>
              <option value="applied">Aplicado</option>
              <option value="interview">Entrevista</option>
              <option value="offer">Oferta</option>
              <option value="rejected">Descartado</option>
            </select>
          </div>

          {/* Min Score */}
          <div className="space-y-1">
            <label className="text-slate-400 font-medium">Score Mínimo IA:</label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 focus:outline-none focus:border-sky-500"
            >
              <option value={0}>Qualquer Score</option>
              <option value={40}>Score &gt;= 40%</option>
              <option value={55}>Score &gt;= 55% (Aprovadas)</option>
              <option value={70}>Score &gt;= 70% (Alta Afinidade)</option>
              <option value={85}>Score &gt;= 85% (Match Perfeito)</option>
            </select>
          </div>

          {/* Only Approved Toggle */}
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={onlyApproved}
                onChange={(e) => setOnlyApproved(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900"
              />
              <span>Apenas Jr Aprovadas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>
            Exibindo <strong>{jobs.length}</strong> {jobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
          </span>
          <span>Clique em qualquer vaga para ver a análise completa da IA e dicas</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-sky-400" />
            <p className="font-semibold text-slate-300">Carregando oportunidades...</p>
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-1 gap-3.5">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={(j: ProcessedJob) => setSelectedJob(j)}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl space-y-3">
            <Briefcase className="w-10 h-10 mx-auto text-slate-500" />
            <p className="text-base font-semibold text-slate-300">Nenhuma vaga encontrada com os filtros selecionados.</p>
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-all"
            >
              Resetar Filtros
            </button>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      <JobModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
