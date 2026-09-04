'use client';

import React, { useState, useEffect } from 'react';
import { ProcessedJob } from '@/types/job';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import {
  RefreshCw,
  Inbox,
  Send,
  MessageSquare,
  Trophy,
  Ban,
  SlidersHorizontal,
  FolderOpen,
} from 'lucide-react';

interface ColumnDef {
  id: string;
  title: string;
  icon: React.ElementType;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'pending',
    title: 'Inbox / Descobertas',
    icon: Inbox,
  },
  {
    id: 'applied',
    title: 'Candidaturas Enviadas',
    icon: Send,
  },
  {
    id: 'interview',
    title: 'Em Entrevista',
    icon: MessageSquare,
  },
  {
    id: 'offer',
    title: 'Ofertas Recebidas',
    icon: Trophy,
  },
  {
    id: 'rejected',
    title: 'Descartadas',
    icon: Ban,
  },
];

export default function KanbanBoardPage() {
  const [jobs, setJobs] = useState<ProcessedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const fetchBoardJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs?minScore=40');
      const json = await res.json();
      if (json.success) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Erro ao carregar vagas do Kanban:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoardJobs();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, applicationStatus: newStatus as any } : j))
    );
    if (selectedJob && selectedJob.id === id) {
      setSelectedJob({ ...selectedJob, applicationStatus: newStatus as any });
    }

    try {
      await fetch(`/api/jobs/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error('Erro ao persistir status:', err);
      fetchBoardJobs(); // Revert on failure
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedJobId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
    if (jobId) {
      handleUpdateStatus(jobId, targetColumnId);
    }
    setDraggedJobId(null);
  };

  // Quick stats calculations
  const totalJobs = jobs.length;
  const pendingCount = jobs.filter((j) => (j.applicationStatus || 'pending') === 'pending').length;
  const appliedCount = jobs.filter((j) => j.applicationStatus === 'applied').length;
  const interviewCount = jobs.filter((j) => j.applicationStatus === 'interview').length;
  const offerCount = jobs.filter((j) => j.applicationStatus === 'offer').length;
  const rejectedCount = jobs.filter((j) => j.applicationStatus === 'rejected').length;

  const pendingPct = totalJobs > 0 ? Math.round((pendingCount / totalJobs) * 100) : 0;
  const appliedPct = totalJobs > 0 ? Math.round((appliedCount / totalJobs) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-300">
      {/* Header Controls & Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1 border-b border-zinc-200 dark:border-zinc-800/80">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
              Pipeline Operacional
            </span>
            <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              {totalJobs} oportunidades ativas
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Kanban de Gestão de Candidaturas
          </h1>
          <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Arraste e solte os cards entre as colunas para acompanhar seu progresso em cada processo seletivo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
          <button
            onClick={fetchBoardJobs}
            disabled={loading}
            type="button"
            className="h-9 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors flex items-center gap-2 text-xs md:text-sm font-medium shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar Board</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Bar (Linear / SaaS Spark Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* Descobertas */}
        <div className="p-3.5 bg-white dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            Descobertas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
              {pendingCount}
            </span>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              {pendingPct}%
            </span>
          </div>
        </div>

        {/* Enviadas */}
        <div className="p-3.5 bg-white dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            Enviadas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono">
              {appliedCount}
            </span>
            <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {appliedPct}%
            </span>
          </div>
        </div>

        {/* Em Entrevista */}
        <div className="p-3.5 bg-white dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            Em Entrevista
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
              {interviewCount}
            </span>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Processos
            </span>
          </div>
        </div>

        {/* Ofertas */}
        <div className="p-3.5 bg-white dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-sm flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            Ofertas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-teal-600 dark:text-teal-400 font-mono">
              {offerCount}
            </span>
            <span className="font-mono text-xs text-teal-600 dark:text-teal-400 font-medium">
              Aprovadas
            </span>
          </div>
        </div>

        {/* Descartadas */}
        <div className="p-3.5 bg-white dark:bg-zinc-900/70 rounded-xl border border-zinc-200 dark:border-zinc-800/80 col-span-2 sm:col-span-1 shadow-sm flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-medium">
            Descartadas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl md:text-2xl font-semibold tracking-tight text-zinc-600 dark:text-zinc-400 font-mono">
              {rejectedCount}
            </span>
            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
              Filtro auto
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="p-16 text-center text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-zinc-400" />
          <p className="font-mono text-xs">Carregando quadro de candidaturas...</p>
        </div>
      ) : (
        <div className="overflow-x-auto pb-6">
          <div className="flex items-start gap-4 min-w-[1100px] select-none">
            {COLUMNS.map((col) => {
              const colJobs = jobs.filter(
                (j) => (j.applicationStatus || 'pending') === col.id
              );
              const Icon = col.icon;
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex-1 flex flex-col rounded-xl p-3 bg-zinc-50/60 dark:bg-zinc-900/50 border transition-colors min-h-[560px] ${
                    isOver
                      ? 'border-emerald-500/60 bg-emerald-500/5'
                      : 'border-zinc-200 dark:border-zinc-800/80'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 px-1 border-b border-zinc-200 dark:border-zinc-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 tracking-tight">
                        {col.title}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                      {colJobs.length}
                    </span>
                  </div>

                  {/* Cards Container */}
                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[72vh] pr-0.5">
                    {colJobs.map((job) => (
                      <div
                        key={job.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, job.id)}
                        className="cursor-grab active:cursor-grabbing transform transition-transform"
                      >
                        <JobCard
                          job={job}
                          compact
                          onSelect={(j: ProcessedJob) => setSelectedJob(j)}
                        />
                      </div>
                    ))}

                    {colJobs.length === 0 && (
                      <div className="h-36 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 flex flex-col items-center justify-center p-4 text-center bg-zinc-100/30 dark:bg-zinc-900/20 text-zinc-500 dark:text-zinc-500">
                        <FolderOpen className="w-5 h-5 text-zinc-400 dark:text-zinc-600 mb-1.5 opacity-60" />
                        <p className="font-mono text-[11px] leading-relaxed">
                          Nenhuma vaga nesta etapa.
                        </p>
                        <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                          Arraste um card para cá
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Details Modal */}
      <JobModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onStatusChange={handleUpdateStatus}
      />
    </div>
  );
}
