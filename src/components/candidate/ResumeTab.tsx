'use client';

import React from 'react';
import {
  FileText,
  UploadCloud,
  Trash2,
  FileUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Check,
  Award,
  Crown,
} from 'lucide-react';
import { UserData, ResumeData } from './types';

interface ResumeTabProps {
  user: UserData | null;
  resume: ResumeData | null;
  uploadingResume: boolean;
  analyzingResume: boolean;
  syncingSkills: boolean;
  resumeFeedback: { type: 'success' | 'error'; message: string } | null;
  syncFeedback: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyzeResume: () => void;
  onDeleteResume: () => void;
  onSyncSkills: (
    skills: string[],
    detectedRole?: string,
    detectedSeniority?: string,
    summary?: string
  ) => void;
  onUpgradeClick: () => void;
}

export function ResumeTab({
  user,
  resume,
  uploadingResume,
  analyzingResume,
  syncingSkills,
  resumeFeedback,
  syncFeedback,
  fileInputRef,
  onFileUpload,
  onAnalyzeResume,
  onDeleteResume,
  onSyncSkills,
  onUpgradeClick,
}: ResumeTabProps) {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Bloco de Upload / Gerenciamento */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 md:p-8 shadow-xs">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Currículo & Análise Técnica
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Envie seu currículo nos formatos PDF ou Word para extração automática de dados e diagnóstico de compatibilidade com vagas.
            </p>
          </div>

          {resume && (
            user?.tier === 'free' && resume.ai_analysis ? (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium px-3.5 py-2 text-xs transition-colors self-start md:self-auto shadow-2xs"
              >
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Upgrade Pro para Reanalisar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onAnalyzeResume}
                disabled={analyzingResume}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 text-xs transition-colors self-start md:self-auto disabled:opacity-50 shadow-xs"
              >
                {analyzingResume ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando Análise...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{resume.ai_analysis ? 'Reanalisar Currículo' : 'Analisar Currículo'}</span>
                  </>
                )}
              </button>
            )
          )}
        </div>

        {resumeFeedback && (
          <div
            className={`mb-6 flex items-center gap-2.5 rounded-lg border p-3 text-xs animate-in fade-in duration-200 ${
              resumeFeedback.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
                : 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
            }`}
          >
            {resumeFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{resumeFeedback.message}</span>
          </div>
        )}

        {/* Input Oculto de Arquivo */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={onFileUpload}
          accept=".pdf,.docx,.doc"
          className="hidden"
        />

        {resume ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {resume.filename}
                  </h3>
                  <div className="flex items-center gap-2.5 text-xs text-zinc-500 mt-0.5 font-mono">
                    <span>{formatBytes(resume.fileSize)}</span>
                    <span>•</span>
                    <span>Enviado em {new Date(resume.uploadedAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
                >
                  <FileUp className="w-3.5 h-3.5" />
                  <span>Substituir</span>
                </button>
                <button
                  type="button"
                  onClick={onDeleteResume}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-400 px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            {!resume.ai_analysis && (
              <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5">
                <div>
                  <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    Currículo pronto para processamento
                  </h4>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                    Execute a análise para extrair senioridade, resumo executivo, tecnologias e recomendações de alinhamento com vagas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onAnalyzeResume}
                  disabled={analyzingResume}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-1.5 text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-2xs"
                >
                  {analyzingResume ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Executar Análise</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer border-2 border-dashed border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 rounded-xl p-10 text-center bg-zinc-50/50 dark:bg-zinc-950/20 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors group"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 shadow-2xs transition-colors">
              {uploadingResume ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {uploadingResume ? 'Processando envio do arquivo...' : 'Clique para selecionar seu currículo'}
            </h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-xs mx-auto">
              Formatos aceitos: <strong>PDF</strong> (.pdf) ou <strong>Word</strong> (.docx, .doc) de até 10MB.
            </p>
          </div>
        )}
      </div>

      {/* Painel de Resultados do Diagnóstico */}
      {resume?.ai_analysis && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 md:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Diagnóstico Extraído do Currículo
                </span>
                {resume.ai_analysis.source && (
                  <span className="text-[10px] text-zinc-400 font-mono">
                    • {resume.ai_analysis.source}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                {resume.ai_analysis.detected_role}
              </h3>
            </div>

            <div className="self-start md:self-center">
              <span className="text-xs text-zinc-500 block mb-0.5">Senioridade Detectada:</span>
              <span className="inline-block rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 font-mono">
                {resume.ai_analysis.detected_seniority}
              </span>
            </div>
          </div>

          {/* Resumo Executivo */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 p-4">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">
              Resumo Executivo do Perfil
            </span>
            <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {resume.ai_analysis.summary}
            </p>
          </div>

          {/* Hard Skills Identificadas */}
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Tecnologias & Hard Skills Identificadas ({resume.ai_analysis.hard_skills.length})
              </span>

              <button
                type="button"
                onClick={() =>
                  onSyncSkills(
                    resume.ai_analysis?.hard_skills || [],
                    resume.ai_analysis?.detected_role,
                    resume.ai_analysis?.detected_seniority,
                    resume.ai_analysis?.summary
                  )
                }
                disabled={syncingSkills}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 self-start sm:self-auto shadow-2xs"
              >
                {syncingSkills ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3 text-emerald-600" />
                )}
                <span>Sincronizar com Meu Perfil</span>
              </button>
            </div>

            {syncFeedback && (
              <div className="mb-2.5 rounded border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-2 text-xs text-emerald-800 dark:text-emerald-300 font-mono animate-in fade-in">
                {syncFeedback}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5 pt-1">
              {resume.ai_analysis.hard_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-2.5 py-0.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 shadow-2xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Grid de Pontos Fortes e Recomendações ATS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Pontos Fortes */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Pontos Fortes do Currículo</span>
              </div>
              <ul className="space-y-2">
                {resume.ai_analysis.strengths.map((str, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dicas ATS */}
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                <span>Otimizações para Vagas & ATS</span>
              </div>
              <ul className="space-y-2">
                {resume.ai_analysis.improvement_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    <span className="text-zinc-400 font-bold shrink-0">•</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
