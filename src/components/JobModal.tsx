'use client';

import React from 'react';
import { ProcessedJob } from '@/types/job';
import { ScoreBadge } from './ScoreBadge';
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Building2,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Layers,
  Award,
} from 'lucide-react';

interface JobModalProps {
  job: ProcessedJob | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function JobModal({ job, onClose, onStatusChange }: JobModalProps) {
  if (!job) return null;

  const publishedStr = new Date(job.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl glass-panel border border-slate-700/80 shadow-2xl overflow-hidden bg-slate-900/95">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-slate-900/50">
          <div className="space-y-1.5 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
                {job.platform}
              </span>
              {job.category && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  {job.category}
                </span>
              )}
              <ScoreBadge score={job.overallScore ?? job.scoreIa} size="sm" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {job.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {job.company}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {job.location || 'Remoto'}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                {publishedStr}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Granular Score Deconstruction */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-4">
            <div className="flex items-center gap-2 text-sky-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Análise Granular de Compatibilidade (Hermes IA)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> Stack Match
                  </span>
                  <span className="font-bold text-indigo-300">{job.stackScore ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full"
                    style={{ width: `${job.stackScore ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-sky-400" /> Senioridade
                  </span>
                  <span className="font-bold text-sky-300">{job.seniorityScore ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-sky-500 h-2 rounded-full"
                    style={{ width: `${job.seniorityScore ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Local / Modelo
                  </span>
                  <span className="font-bold text-emerald-300">{job.locationScore ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${job.locationScore ?? 0}%` }}
                  />
                </div>
              </div>
            </div>

            {job.aiReasoning && (
              <p className="text-xs md:text-sm text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800/80 leading-relaxed">
                💡 <strong>Parecer:</strong> {job.aiReasoning}
              </p>
            )}
          </div>

          {/* Gaps Analysis */}
          {job.gaps && job.gaps.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Gaps / Tecnologias Adicionais Exigidas</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {job.gaps.map((gap, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-200 border border-amber-500/30 font-medium uppercase"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Resume Tips (Dicas de Apresentação) */}
          {job.resumeTips && (
            <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
              <div className="flex items-center gap-2 text-indigo-300 font-semibold text-sm">
                <Lightbulb className="w-4 h-4 text-indigo-400" />
                <span>Dicas de Personalização de Currículo & Apresentação</span>
              </div>
              <p className="text-xs md:text-sm text-indigo-100/90 leading-relaxed italic bg-indigo-950/40 p-3 rounded-lg border border-indigo-500/20">
                "{job.resumeTips}"
              </p>
            </div>
          )}

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Descrição da Vaga
            </h3>
            <div className="text-xs md:text-sm text-slate-300 bg-slate-950/60 p-4 rounded-xl border border-slate-800 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {job.description || 'Descrição não disponível.'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 border-t border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="text-slate-400">Status da Candidatura:</span>
            <select
              value={job.applicationStatus || 'pending'}
              onChange={(e) => onStatusChange && onStatusChange(job.id, e.target.value)}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="pending">Inbox (Pendente)</option>
              <option value="applied">Aplicado</option>
              <option value="interview">Entrevista</option>
              <option value="offer">Oferta Recebida</option>
              <option value="rejected">Descartado</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs md:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Fechar
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/20 transition-all hover:scale-105"
            >
              <span>Abrir Vaga Original</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
