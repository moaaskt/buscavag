'use client';

import React, { useState, useEffect } from 'react';
import { ProcessedJob } from '@/types/job';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import {
  Search,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal,
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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
        setCurrentPage(1); // Reset to page 1 on new filter/search
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

  // Pagination slice
  const totalItems = jobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedJobs = jobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300">
      {/* Top Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Live Sync
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              26+ Fontes Integradas
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Explorador Inteligente de Vagas
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Filtre por pontuação de compatibilidade, tecnologia, modelo de trabalho e plataforma de recrutamento.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              type="button"
              className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1.5 text-xs md:text-sm font-medium shadow-sm"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
          <button
            onClick={fetchJobs}
            disabled={loading}
            type="button"
            className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2 text-xs md:text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls (Linear / Shadcn Zinc Style) */}
      <div className="bg-white dark:bg-zinc-900/70 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-4">
        {/* Search Row */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative w-full flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por cargo (ex: Full Stack, React, Node), empresa ou tecnologia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto h-10 px-5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-100 dark:text-zinc-900 text-xs md:text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-sm"
          >
            <span>Buscar</span>
          </button>
        </form>

        {/* Filters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
          {/* Plataforma */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Plataforma
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors cursor-pointer"
            >
              <option value="all">Todas as Fontes (26+)</option>
              <optgroup label="Principais">
                <option value="linkedin">LinkedIn</option>
                <option value="gupy">Gupy</option>
                <option value="indeed">Indeed</option>
                <option value="glassdoor">Glassdoor</option>
                <option value="catho">Catho</option>
                <option value="google_jobs">Google Jobs</option>
                <option value="programathor">Programathor</option>
                <option value="remotar">Remotar</option>
                <option value="telegram">Telegram</option>
              </optgroup>
              <optgroup label="Regionais SC">
                <option value="sao_jose">São José Empregos</option>
                <option value="vagas_sc">Vagas SC</option>
                <option value="vagas_floripa">Vagas Floripa</option>
                <option value="emprega_palhoca">Emprega Palhoça</option>
              </optgroup>
              <optgroup label="Nacionais & ATSs">
                <option value="infojobs">Infojobs</option>
                <option value="chawork">Chawork</option>
                <option value="trabalha_brasil">Trabalha Brasil</option>
                <option value="bne">BNE Empregos</option>
                <option value="bebee">beBee</option>
                <option value="empregos">Empregos.com.br</option>
                <option value="recruta_simples">Recruta Simples</option>
                <option value="recrutei_empregos">Recrutei Empregos</option>
                <option value="quickin">Quickin ATS</option>
                <option value="recrutei_jobs">PeoplePlan (Recrutei)</option>
                <option value="pandape">PandaPé ATS</option>
              </optgroup>
            </select>
          </div>

          {/* Categoria */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors cursor-pointer"
            >
              <option value="all">Todas as Categorias</option>
              <option value="IoT & Automação">⚡ IoT & Automação (ESP32/MQTT)</option>
              <option value="Full Stack">Full Stack</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Mobile">Mobile</option>
              <option value="DevOps">DevOps</option>
              <option value="Data">Data / Analytics</option>
            </select>
          </div>

          {/* Status Candidatura */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Status Candidatura
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pending">Inbox (Pendente)</option>
              <option value="applied">Aplicado</option>
              <option value="interview">Em Entrevista</option>
              <option value="offer">Oferta Recebida</option>
              <option value="rejected">Descartado</option>
            </select>
          </div>

          {/* Score Mínimo IA */}
          <div className="flex flex-col gap-1">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Score Mínimo IA
            </label>
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full h-9 px-2.5 bg-zinc-50 dark:bg-zinc-800/80 rounded-lg border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors cursor-pointer"
            >
              <option value={0}>Qualquer Score</option>
              <option value={75}>&gt; 75% Alta Afinidade</option>
              <option value={60}>&gt; 60% Média Afinidade</option>
              <option value={40}>&gt; 40% Score Base</option>
            </select>
          </div>

          {/* Checkbox Apenas Jr */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 flex items-center justify-start lg:justify-end pt-2 lg:pt-4">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs text-zinc-700 dark:text-zinc-300 font-medium">
              <input
                type="checkbox"
                checked={onlyApproved}
                onChange={(e) => setOnlyApproved(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-0 focus:ring-offset-0 bg-zinc-50 dark:bg-zinc-800 cursor-pointer"
              />
              <span>Apenas Jr Aprovadas</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Counter & Helper Line */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-mono text-xs md:text-sm text-zinc-800 dark:text-zinc-200 font-medium">
            Exibindo {totalItems} {totalItems === 1 ? 'vaga encontrada' : 'vagas encontradas'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
          <Info className="w-3.5 h-3.5" />
          <span>Clique em qualquer vaga para ver a análise completa da IA e dicas</span>
        </div>
      </div>

      {/* Job Cards List */}
      {loading ? (
        <div className="p-12 text-center text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-zinc-400" />
          <p className="text-xs font-mono">Carregando oportunidades...</p>
        </div>
      ) : paginatedJobs.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {paginatedJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onSelect={(j: ProcessedJob) => setSelectedJob(j)}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 space-y-3">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 font-mono">
            Nenhuma vaga encontrada com os filtros selecionados.
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-colors"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      )}

      {/* Pagination & Footer Navigation */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 pb-6 border-t border-zinc-200 dark:border-zinc-800/60">
          <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
            <span>Itens por página:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="h-8 px-2 bg-zinc-50 dark:bg-zinc-800/80 rounded border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
            >
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
            <span className="ml-2">
              Página {currentPage} de {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              type="button"
              className="h-8 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              type="button"
              className="h-8 px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <span>Próximo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      <JobModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
