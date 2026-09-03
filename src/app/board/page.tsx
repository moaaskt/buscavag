'use client';

import React, { useState, useEffect } from 'react';
import { ProcessedJob } from '@/types/job';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import {
  Columns3,
  RefreshCw,
  Inbox,
  Send,
  MessageSquare,
  Trophy,
  Ban,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ColumnDef {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  badgeColor: string;
}

const COLUMNS: ColumnDef[] = [
  {
    id: 'pending',
    title: 'Inbox / Descobertas',
    icon: Inbox,
    color: 'border-slate-700 bg-slate-900/40',
    badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
  },
  {
    id: 'applied',
    title: 'Candidaturas Enviadas',
    icon: Send,
    color: 'border-sky-500/20 bg-sky-950/10',
    badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  },
  {
    id: 'interview',
    title: 'Em Entrevista',
    icon: MessageSquare,
    color: 'border-amber-500/20 bg-amber-950/10',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'offer',
    title: 'Oferta Recebida',
    icon: Trophy,
    color: 'border-emerald-500/20 bg-emerald-950/10',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'rejected',
    title: 'Descartadas',
    icon: Ban,
    color: 'border-rose-500/20 bg-rose-950/10',
    badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
];

export default function KanbanBoardPage() {
  const [jobs, setJobs] = useState<ProcessedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ProcessedJob | null>(null);
  const [draggedJobId, setDraggedJobId] = useState<string | null>(null);

  const fetchBoardJobs = async () => {
    setLoading(true);
    try {
      // Buscar apenas vagas aprovadas Jr ou com score relevante
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
    // Atualização otimista local
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
      fetchBoardJobs(); // Reverte em caso de erro
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedJobId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('text/plain') || draggedJobId;
    if (jobId) {
      handleUpdateStatus(jobId, targetColumnId);
    }
    setDraggedJobId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Columns3 className="w-6 h-6 text-emerald-400" />
            <span>Kanban de Gestão de Candidaturas</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-400 mt-1">
            Arraste e solte os cards entre as colunas para acompanhar seu progresso em cada processo seletivo.
          </p>
        </div>

        <button
          onClick={fetchBoardJobs}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Board</span>
        </button>
      </div>

      {/* Board Columns Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 glass-panel rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400" />
          <p className="font-semibold text-slate-300">Carregando quadro de candidaturas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start min-h-[600px] overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colJobs = jobs.filter(
              (j) => (j.applicationStatus || 'pending') === col.id
            );
            const Icon = col.icon;

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex flex-col rounded-2xl p-4 glass-panel border ${col.color} min-h-[500px] transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-slate-300" />
                    <span className="text-xs font-bold text-white tracking-tight">
                      {col.title}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${col.badgeColor}`}
                  >
                    {colJobs.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[70vh]">
                  {colJobs.map((job) => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <JobCard
                        job={job}
                        compact
                        onSelect={(j: ProcessedJob) => setSelectedJob(j)}
                      />
                    </div>
                  ))}

                  {colJobs.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-center p-3 text-slate-500 text-xs">
                      <span>Nenhuma vaga nesta etapa</span>
                      <span className="text-[10px] text-slate-600 mt-1">
                        Arraste um card para cá
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
