'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  X,
  Play,
  Pause,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  Sparkles,
  Layers,
  ArrowDown,
  RotateCw,
} from 'lucide-react';
import { ScraperEvent } from '@/services/scraperLogger';
import { cn } from '@/lib/utils';

interface ScraperTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  runId?: string;
}

interface SourceStatus {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  jobsFound?: number;
  durationMs?: number;
  error?: string;
}

export function ScraperTerminalModal({ isOpen, onClose, runId }: ScraperTerminalModalProps) {
  const [logs, setLogs] = useState<ScraperEvent[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [sources, setSources] = useState<Record<string, SourceStatus>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<{
    totalJobs?: number;
    approvedCount?: number;
    evaluatedCount?: number;
    errorCount?: number;
    successCount?: number;
    durationSeconds?: number;
  } | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Iniciar conexão SSE ao abrir o modal
  useEffect(() => {
    if (!isOpen) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    setIsRunning(true);
    setSummary(null);

    const es = new EventSource('/api/scraper/stream');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        if (!event.data || event.data.startsWith(':')) return; // Ignore heartbeats
        const parsed: ScraperEvent = JSON.parse(event.data);

        setLogs((prev) => [...prev, parsed]);

        // Atualizar status por scraper
        if (parsed.scraperName && parsed.scraperName !== 'System' && parsed.scraperName !== 'Pipeline' && parsed.scraperName !== 'Orchestrator') {
          setSources((prev) => {
            const current = prev[parsed.scraperName] || { name: parsed.scraperName, status: 'pending' };
            if (parsed.level === 'ERROR') {
              return {
                ...prev,
                [parsed.scraperName]: {
                  ...current,
                  status: 'failed',
                  error: parsed.message,
                  durationMs: parsed.data?.durationMs,
                },
              };
            }
            if (parsed.step === 'START') {
              return { ...prev, [parsed.scraperName]: { ...current, status: 'running' } };
            }
            if (parsed.step === 'FINISH') {
              return {
                ...prev,
                [parsed.scraperName]: {
                  ...current,
                  status: 'completed',
                  jobsFound: parsed.data?.jobsFound ?? current.jobsFound ?? 0,
                  durationMs: parsed.data?.durationMs,
                },
              };
            }
            return prev;
          });
        }

        // Detectar encerramento do ciclo
        if (parsed.step === 'FINISH' && (parsed.scraperName === 'Pipeline' || parsed.scraperName === 'Orchestrator')) {
          setIsRunning(false);
          if (parsed.data) {
            setSummary((prev) => ({
              ...prev,
              totalJobs: parsed.data?.totalJobs ?? prev?.totalJobs,
              approvedCount: parsed.data?.approvedCount ?? prev?.approvedCount,
              evaluatedCount: parsed.data?.evaluatedCount ?? prev?.evaluatedCount,
              errorCount: parsed.data?.errorCount ?? prev?.errorCount,
              successCount: parsed.data?.successCount ?? prev?.successCount,
              durationSeconds: parsed.data?.durationSeconds ?? prev?.durationSeconds,
            }));
          }
        }
      } catch (err) {
        console.error('[Terminal SSE Parse Error]:', err);
      }
    };

    es.onerror = (err) => {
      console.warn('[Terminal SSE Disconnected/Reconnecting]:', err);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isOpen]);

  // Auto-scroll para a última linha do terminal
  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  if (!isOpen) return null;

  const clearLogs = () => {
    setLogs([]);
    setSources({});
    setSummary(null);
  };

  const sourceList = Object.values(sources);
  const completedSourcesCount = sourceList.filter((s) => s.status === 'completed' || s.status === 'failed').length;
  const totalTrackedSources = Math.max(sourceList.length, 24);
  const progressPercent = Math.min(100, Math.round((completedSourcesCount / totalTrackedSources) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        aria-modal="true"
        role="dialog"
        className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-zinc-100"
      >
        {/* Top Terminal Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/90 border-b border-zinc-800 select-none">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-mono font-semibold tracking-wide text-zinc-200">
                buscavag-engine://scraper-stream
              </span>
              {isRunning && (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              )}
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors',
                autoScroll
                  ? 'bg-zinc-800/80 border-zinc-700 text-emerald-400'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              )}
              title={autoScroll ? 'Pausar auto-scroll' : 'Ativar auto-scroll'}
            >
              <ArrowDown className={cn('w-3.5 h-3.5', autoScroll ? 'text-emerald-400 animate-bounce' : '')} />
              <span className="hidden sm:inline">Auto-scroll</span>
            </button>

            <button
              onClick={clearLogs}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 transition-colors"
              title="Limpar console"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
              title="Fechar terminal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress & Stepper Bar */}
        <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-zinc-400">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>
                Fontes ativas:{' '}
                <strong className="text-zinc-200">
                  {completedSourcesCount}/{totalTrackedSources}
                </strong>
              </span>
            </div>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Terminal Log Console */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1 bg-zinc-950/95 scrollbar-thin scrollbar-thumb-zinc-800">
          {logs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
              <p>Aguardando fluxo de eventos do pipeline...</p>
            </div>
          ) : (
            logs.map((log, index) => {
              const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString('pt-BR') : '--:--:--';
              return (
                <div
                  key={log.id || index}
                  className={cn(
                    'flex items-start gap-2 py-0.5 px-1.5 rounded transition-colors',
                    log.level === 'ERROR'
                      ? 'bg-rose-950/20 text-rose-300'
                      : log.level === 'WARN'
                      ? 'bg-amber-950/20 text-amber-300'
                      : 'hover:bg-zinc-900/40 text-zinc-300'
                  )}
                >
                  <span className="text-zinc-600 shrink-0 select-none">[{timeStr}]</span>

                  {/* Tag do Level */}
                  <span
                    className={cn(
                      'px-1 py-0.2 text-[10px] font-bold rounded uppercase shrink-0 select-none',
                      log.level === 'ERROR'
                        ? 'bg-rose-900/80 text-rose-200'
                        : log.level === 'WARN'
                        ? 'bg-amber-900/80 text-amber-200'
                        : 'bg-zinc-800 text-zinc-300'
                    )}
                  >
                    {log.level}
                  </span>

                  {/* Nome do Scraper / Componente */}
                  <span className="text-emerald-400 font-semibold shrink-0">
                    [{log.scraperName || 'System'}]:
                  </span>

                  {/* Mensagem */}
                  <span className="flex-1 break-words whitespace-pre-wrap">{log.message}</span>
                </div>
              );
            })
          )}
          <div ref={terminalEndRef} />
        </div>

        {/* Resumo Final Footer Banner */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-zinc-900 border-t border-emerald-800/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-zinc-100">Sincronização Concluída com Sucesso!</span>
            </div>
            <div className="flex items-center gap-4 text-zinc-300">
              {summary.totalJobs !== undefined && (
                <span>
                  Coletadas: <strong className="text-emerald-400">{summary.totalJobs}</strong>
                </span>
              )}
              {summary.approvedCount !== undefined && (
                <span>
                  Aprovadas: <strong className="text-emerald-400">{summary.approvedCount}</strong>
                </span>
              )}
              {summary.errorCount !== undefined && summary.errorCount > 0 && (
                <span>
                  Erros: <strong className="text-rose-400">{summary.errorCount}</strong>
                </span>
              )}
              {summary.durationSeconds !== undefined && (
                <span>
                  Duração: <strong className="text-zinc-200">{summary.durationSeconds}s</strong>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
