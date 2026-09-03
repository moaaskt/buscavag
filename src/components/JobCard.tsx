'use client';

import React from 'react';
import { ProcessedJob } from '@/types/job';
import { ScoreBadge } from './ScoreBadge';
import {
  Building2,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface JobCardProps {
  job: ProcessedJob;
  onSelect: (job: ProcessedJob) => void;
  compact?: boolean;
}

export function JobCard({ job, onSelect, compact = false }: JobCardProps) {
  const publishedStr = new Date(job.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  const platformColors: Record<string, string> = {
    linkedin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    gupy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    indeed: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    google_jobs: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    telegram: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    programathor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    remotar: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    catho: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    glassdoor: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const statusBadges: Record<string, { label: string; color: string }> = {
    pending: { label: 'Inbox', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    applied: { label: 'Aplicado', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
    interview: { label: 'Entrevista', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    offer: { label: 'Oferta', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    rejected: { label: 'Descartado', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  };

  const statusInfo = statusBadges[job.applicationStatus || 'pending'] || statusBadges.pending;

  if (compact) {
    return (
      <div
        onClick={() => onSelect(job)}
        className="group relative p-3.5 rounded-xl glass-card cursor-pointer border border-slate-800 hover:border-sky-500/50 transition-all"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span
            className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
              platformColors[job.platform] || 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {job.platform}
          </span>
          <ScoreBadge score={job.overallScore ?? job.scoreIa} size="sm" />
        </div>

        <h4 className="text-sm font-semibold text-white group-hover:text-sky-300 transition-colors line-clamp-1">
          {job.title}
        </h4>
        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
          <Building2 className="w-3 h-3" />
          <span className="truncate">{job.company}</span>
        </p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span className="truncate max-w-[110px]">{job.location || 'Remoto'}</span>
          </span>
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusInfo.color}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onSelect(job)}
      className="group relative p-5 rounded-2xl glass-card cursor-pointer border border-slate-800/80 hover:border-sky-500/40 hover:shadow-xl hover:shadow-sky-500/5 transition-all"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md border tracking-wider ${
                platformColors[job.platform] || 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {job.platform}
            </span>
            {job.category && (
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {job.category}
              </span>
            )}
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>

          <h3 className="text-base md:text-lg font-bold text-white group-hover:text-sky-300 transition-colors">
            {job.title}
          </h3>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {job.company}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {job.location || 'Remoto'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {publishedStr}
            </span>
          </div>

          {job.aiReasoning && (
            <p className="text-xs text-slate-400 line-clamp-1 italic pt-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{job.aiReasoning}</span>
            </p>
          )}
        </div>

        {/* Right: Scores & Action */}
        <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="text-right">
            <ScoreBadge score={job.overallScore ?? job.scoreIa} size="md" />
            {job.stackScore !== undefined && (
              <p className="text-[10px] text-slate-400 mt-1">
                Stack: <span className="text-indigo-300 font-semibold">{job.stackScore}%</span>
              </p>
            )}
          </div>

          <div className="p-2 rounded-xl bg-slate-800/60 text-slate-400 group-hover:text-white group-hover:bg-sky-500 group-hover:shadow-lg group-hover:shadow-sky-500/20 transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
