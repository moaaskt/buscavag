'use client';

import React, { useEffect, useState } from 'react';
import { ScraperLog, LogLevel, ScraperRunSummary } from '@/types/log';
import {
  Terminal,
  Filter,
  RefreshCw,
  Search,
  AlertTriangle,
  XCircle,
  Info,
  Copy,
  Check,
  Calendar,
  Layers,
  Clock,
  ChevronDown,
  ChevronUp,
  FileCode,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export default function LogsPage() {
  const [logs, setLogs] = useState<ScraperLog[]>([]);
  const [runs, setRuns] = useState<ScraperRunSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'ALL'>('ALL');
  const [selectedScraper, setSelectedScraper] = useState<string>('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('24h');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'logs' | 'runs'>('logs');

  // Modal de Detalhes / Stack Trace
  const [selectedLog, setSelectedLog] = useState<ScraperLog | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedLevel !== 'ALL') params.set('level', selectedLevel);
      if (selectedScraper !== 'ALL') params.set('scraperName', selectedScraper);
      if (selectedPeriod !== 'ALL') params.set('period', selectedPeriod);
      params.set('limit', '100');

      const [logsRes, runsRes] = await Promise.all([
        fetch(`/api/scraper/logs?${params.toString()}`),
        fetch('/api/scraper/logs?runs=true'),
      ]);

      const logsData = await logsRes.json();
      const runsData = await runsRes.json();

      if (logsData.success) {
        setLogs(logsData.data || []);
        setTotal(logsData.total || 0);
      }

      if (runsData.success) {
        setRuns(runsData.data || []);
      }
    } catch (err) {
      console.error('[LogsPage error]:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedLevel, selectedScraper, selectedPeriod]);

  // Lista dinâmica de scrapers para filtro
  const allScrapers = Array.from(
    new Set(logs.map((l) => l.scraperName).filter((s) => s && s !== 'System' && s !== 'Pipeline'))
  ).sort();

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.message.toLowerCase().includes(query) ||
      log.scraperName.toLowerCase().includes(query) ||
      (log.details && log.details.toLowerCase().includes(query))
    );
  });

  const handleCopyDetails = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-zinc-100">
              Logs & Auditoria dos Scrapers
            </h1>
          </div>
          <p className="text-xs md:text-sm text-zinc-400 font-mono mt-1">
            Histórico detalhado de coletas, eventos, avisos e diagnóstico de erros.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Alternador de visualização Logs / Ciclos */}
          <div className="flex rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 text-xs font-mono">
            <button
              onClick={() => setActiveTab('logs')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                activeTab === 'logs'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Logs ({filteredLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('runs')}
              className={cn(
                'px-3 py-1 rounded-md transition-colors',
                activeTab === 'runs'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Ciclos ({runs.length})
            </button>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading ? 'animate-spin text-emerald-400' : '')} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/80">
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar em mensagens ou stack trace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs font-mono bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Level Filter */}
        <div>
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as any)}
            className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Severidade: Todos</option>
            <option value="ERROR">Apenas Erros (ERROR)</option>
            <option value="WARN">Alertas e Avisos (WARN)</option>
            <option value="INFO">Informativos (INFO)</option>
          </select>
        </div>

        {/* Scraper Source Filter */}
        <div>
          <select
            value={selectedScraper}
            onChange={(e) => setSelectedScraper(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="ALL">Fonte: Todas as 24+ fontes</option>
            {allScrapers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Period Filter */}
        <div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full px-3 py-1.5 text-xs font-mono bg-zinc-950/80 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors"
          >
            <option value="24h">Período: Últimas 24 horas</option>
            <option value="48h">Últimas 48 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="ALL">Todo o Histórico</option>
          </select>
        </div>
      </div>

      {/* Main Content: Logs Table vs Runs Summary */}
      {activeTab === 'logs' ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400">
                  <th className="py-2.5 px-4 font-semibold">Data/Hora</th>
                  <th className="py-2.5 px-4 font-semibold">Nível</th>
                  <th className="py-2.5 px-4 font-semibold">Fonte</th>
                  <th className="py-2.5 px-4 font-semibold">Mensagem</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {loading && logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      Carregando logs do banco de dados...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500">
                      Nenhum registro de log encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const formattedDate = new Date(log.createdAt).toLocaleString('pt-BR');
                    return (
                      <tr
                        key={log.id}
                        onClick={() => log.details && setSelectedLog(log)}
                        className={cn(
                          'hover:bg-zinc-900/50 transition-colors cursor-pointer',
                          log.level === 'ERROR' ? 'bg-rose-950/10' : log.level === 'WARN' ? 'bg-amber-950/10' : ''
                        )}
                      >
                        <td className="py-2.5 px-4 text-zinc-500 whitespace-nowrap">{formattedDate}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 rounded text-[10px] font-bold uppercase',
                              log.level === 'ERROR'
                                ? 'bg-rose-900/80 text-rose-200'
                                : log.level === 'WARN'
                                ? 'bg-amber-900/80 text-amber-200'
                                : 'bg-zinc-800 text-zinc-300'
                            )}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-emerald-400 whitespace-nowrap">
                          {log.scraperName}
                        </td>
                        <td className="py-2.5 px-4 text-zinc-300 break-words max-w-xl">
                          {log.message}
                        </td>
                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                          {log.details ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLog(log);
                              }}
                              className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] transition-colors"
                            >
                              Ver Stack
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Runs Summary Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {runs.map((run) => {
            const started = new Date(run.startedAt).toLocaleString('pt-BR');
            return (
              <div
                key={run.runId}
                className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 flex flex-col justify-between space-y-3 font-mono text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Ciclo ID:</span>
                    <span className="text-emerald-400 font-semibold truncate max-w-[150px]">{run.runId}</span>
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">Iniciado em: {started}</div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-y border-zinc-800/80 text-center">
                  <div>
                    <div className="text-zinc-500 text-[10px]">INFO</div>
                    <div className="font-semibold text-zinc-200">{run.infoCount}</div>
                  </div>
                  <div>
                    <div className="text-amber-400 text-[10px]">WARN</div>
                    <div className="font-semibold text-amber-300">{run.warnCount}</div>
                  </div>
                  <div>
                    <div className="text-rose-400 text-[10px]">ERROR</div>
                    <div className="font-semibold text-rose-300">{run.errorCount}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Total de Logs: {run.totalLogs}</span>
                  <button
                    onClick={() => {
                      setSearchQuery(run.runId);
                      setActiveTab('logs');
                    }}
                    className="text-emerald-400 hover:underline"
                  >
                    Filtrar Logs →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalhes do Erro / Stack Trace */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-zinc-950 border border-zinc-800 shadow-2xl overflow-hidden font-mono text-xs text-zinc-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90">
                <div className="flex items-center gap-2">
                  {selectedLog.level === 'ERROR' ? (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className="font-semibold text-sm">
                    Detalhes do Log — [{selectedLog.scraperName}]
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <div>
                  <span className="text-zinc-500 text-[11px]">Mensagem:</span>
                  <p className="text-zinc-200 mt-0.5">{selectedLog.message}</p>
                </div>

                {selectedLog.details && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-zinc-500 text-[11px]">Stack Trace / Payload:</span>
                      <button
                        onClick={() => handleCopyDetails(selectedLog.details!)}
                        className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copiado!' : 'Copiar Log'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-zinc-900/90 border border-zinc-800 text-rose-300 text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap select-text font-mono">
                      {selectedLog.details}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-zinc-800 bg-zinc-900/60 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
