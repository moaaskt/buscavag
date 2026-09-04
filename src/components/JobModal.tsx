'use client';

import React, { useState } from 'react';
import { ProcessedJob } from '@/types/job';
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface JobModalProps {
  job: ProcessedJob | null;
  onClose: () => void;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function JobModal({ job, onClose, onStatusChange }: JobModalProps) {
  const [descExpanded, setDescExpanded] = useState(false);

  if (!job) return null;

  const publishedStr = new Date(job.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const overallScore = job.overallScore ?? job.scoreIa ?? 0;
  const stackScore = job.stackScore ?? 0;
  const seniorityScore = job.seniorityScore ?? 0;
  const locationScore = job.locationScore ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        aria-modal="true"
        role="dialog"
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-2 relative">
          {/* Close Button (X) */}
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges / Platform & Category */}
          <div className="flex flex-wrap items-center gap-2 pr-10">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 uppercase font-medium">
              {job.platform}
            </span>
            {job.category && (
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 font-medium">
                {job.category}
              </span>
            )}
            <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              SCORE: {overallScore}%
            </span>
          </div>

          {/* Title */}
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {job.title}
          </h2>

          {/* Meta Information */}
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-mono pt-0.5">
            <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-medium">
              <Building2 className="w-4 h-4 text-zinc-400" />
              {job.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-zinc-400" />
              {job.location || 'Remoto'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-zinc-400" />
              {publishedStr}
            </span>
          </div>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
          {/* SECTION 1: Hermes IA Compatibility */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Análise Granular de Compatibilidade (Hermes IA)
                </h3>
              </div>
            </div>

            {/* 3 Metrics KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Stack Match */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-600 dark:text-zinc-400">Stack Match</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stackScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${stackScore}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Afinidade de stack</span>
              </div>

              {/* Seniority */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-600 dark:text-zinc-400">Senioridade</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{seniorityScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${seniorityScore}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Nível Jr / Entry</span>
              </div>

              {/* Location / Model */}
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800/80 flex flex-col justify-between gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-zinc-600 dark:text-zinc-400">Local / Modelo</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{locationScore}%</span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${locationScore}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Modelo compatível</span>
              </div>
            </div>

            {/* Parecer IA */}
            {job.aiReasoning && (
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono">
                  <strong className="text-zinc-900 dark:text-zinc-100">Parecer:</strong>{' '}
                  {renderHighlightedModalReasoning(job.aiReasoning)}
                </p>
              </div>
            )}
          </section>


          {/* Gaps Analysis */}
          {job.gaps && job.gaps.length > 0 && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-sm font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Gaps / Tecnologias Adicionais Mapeadas</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {job.gaps.map((gap, i) => (
                  <span
                    key={i}
                    className="font-mono text-xs px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60 uppercase font-medium"
                  >
                    {gap}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Resume Tips (Dicas de Apresentação) */}
          {job.resumeTips && (
            <section className="space-y-2.5">
              <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-sm font-semibold">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>Dicas de Personalização de Currículo & Apresentação</span>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800/80 text-xs md:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic">
                "{job.resumeTips}"
              </div>
            </section>
          )}

          {/* Job Description with Expand/Collapse */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold">
                Descrição da Vaga
              </h3>
              <span className="font-mono text-[11px] text-zinc-400">Original Scraped Data</span>
            </div>
            <div className="relative rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/80 p-4">
              <div
                className={`text-xs md:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed transition-all duration-200 ${
                  !descExpanded ? 'line-clamp-6' : ''
                }`}
              >
                {job.description || 'Descrição não disponível.'}
              </div>

              {/* Toggle Button */}
              {job.description && job.description.length > 300 && (
                <div className="pt-3 mt-2 border-t border-zinc-200/60 dark:border-zinc-800/60 flex justify-center">
                  <button
                    onClick={() => setDescExpanded(!descExpanded)}
                    type="button"
                    className="font-mono text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 focus:outline-none transition-colors"
                  >
                    <span>{descExpanded ? 'Recolher descrição' : 'Ver descrição completa'}</span>
                    {descExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <span className="text-zinc-500 dark:text-zinc-400 font-mono text-xs">
              Status:
            </span>
            <select
              value={job.applicationStatus || 'pending'}
              onChange={(e) => onStatusChange && onStatusChange(job.id, e.target.value)}
              className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:outline-none focus:border-zinc-500 cursor-pointer"
            >
              <option value="pending">Inbox (Pendente)</option>
              <option value="applied">Aplicado</option>
              <option value="interview">Em Entrevista</option>
              <option value="offer">Oferta Recebida</option>
              <option value="rejected">Descartado</option>
            </select>
          </div>

          {/* Buttons CTA Group */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={onClose}
              type="button"
              className="h-9 px-4 rounded-lg text-xs md:text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors"
            >
              Fechar
            </button>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-zinc-100 dark:text-zinc-900 text-xs md:text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
            >
              <span>Abrir Vaga Original</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderHighlightedModalReasoning(text: string) {
  if (!text) return null;

  const parts = text.split(/(\b(?:Aprovada|aprovada|Rejeitada|rejeitada|Descartada|descartada)\b)/g);

  return parts.map((part, index) => {
    const lower = part.toLowerCase();
    if (lower === 'aprovada') {
      return (
        <span key={index} className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {part}
        </span>
      );
    }
    if (lower === 'rejeitada' || lower === 'descartada') {
      return (
        <span key={index} className="text-rose-600 dark:text-red-400 font-semibold">
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

