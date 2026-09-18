'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  Clock,
  XCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScraperRunSummary } from '@/types/log';

type HealthStatus = 'healthy' | 'degraded' | 'critical' | 'loading';

export function ScraperHealthMonitor() {
  const [runs, setRuns] = useState<ScraperRunSummary[]>([]);
  const [recentErrors, setRecentErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<HealthStatus>('loading');
  const [hasSessionAlert, setHasSessionAlert] = useState(false);

  const fetchHealthData = async () => {
    setLoading(true);
    try {
      const [runsRes, errorsRes] = await Promise.all([
        fetch('/api/admin/scraper/logs?runs=true'),
        fetch('/api/admin/scraper/logs?level=ERROR&period=24h&limit=20'),
      ]);

      const runsData = await runsRes.json();
      const errorsData = await errorsRes.json();

      const fetchedRuns: ScraperRunSummary[] = runsData.success ? (runsData.data || []).slice(0, 5) : [];
      setRuns(fetchedRuns);

      const errorLogs = errorsData.success ? (errorsData.data || []) : [];
      const errorMessages: string[] = errorLogs.map((l: any) => l.message || '');
      setRecentErrors(errorMessages);

      // Detect session/cookie issues
      const sessionKeywords = ['cookie', 'session', 'login', 'unauthorized', 'autenticação', '401', '403', 'forbidden'];
      const hasSession = errorMessages.some((msg: string) =>
        sessionKeywords.some((kw) => msg.toLowerCase().includes(kw))
      );
      setHasSessionAlert(hasSession);

      // Determine health status
      if (fetchedRuns.length === 0) {
        setHealthStatus('degraded');
      } else {
        const totalErrors = fetchedRuns.reduce((sum, r) => sum + r.errorCount, 0);
        const totalLogs = fetchedRuns.reduce((sum, r) => sum + r.totalLogs, 0);
        const errorRate = totalLogs > 0 ? totalErrors / totalLogs : 0;

        if (errorRate > 0.3 || hasSession) {
          setHealthStatus('critical');
        } else if (errorRate > 0.1) {
          setHealthStatus('degraded');
        } else {
          setHealthStatus('healthy');
        }
      }
    } catch (err) {
      console.error('[ScraperHealthMonitor] Error fetching health data:', err);
      setHealthStatus('critical');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
  }, []);

  const statusConfig = {
    healthy: {
      label: 'Saudável',
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30',
      barColor: 'bg-emerald-500',
    },
    degraded: {
      label: 'Instável',
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30',
      barColor: 'bg-amber-500',
    },
    critical: {
      label: 'Crítico',
      icon: XCircle,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30',
      barColor: 'bg-rose-500',
    },
    loading: {
      label: 'Verificando...',
      icon: Loader2,
      color: 'text-zinc-500',
      bg: 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700',
      barColor: 'bg-zinc-400',
    },
  };

  const current = statusConfig[healthStatus];
  const StatusIcon = current.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-500" />
          <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
            Monitor de Saúde
          </h3>
        </div>
        <button
          onClick={fetchHealthData}
          disabled={loading}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Status Badge */}
      <div className={cn('flex items-center gap-2.5 px-4 py-3 rounded-xl border', current.bg)}>
        <StatusIcon className={cn('w-5 h-5 shrink-0', current.color, healthStatus === 'loading' && 'animate-spin')} />
        <div>
          <span className={cn('text-sm font-semibold', current.color)}>
            {current.label}
          </span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            {healthStatus === 'healthy' && 'Os scrapers estão operando normalmente.'}
            {healthStatus === 'degraded' && 'Alguns scrapers estão falhando ou sem ciclos recentes.'}
            {healthStatus === 'critical' && 'Taxa de erros elevada ou problema de autenticação detectado.'}
            {healthStatus === 'loading' && 'Consultando dados dos últimos ciclos...'}
          </p>
        </div>
      </div>

      {/* Session Alert */}
      {hasSessionAlert && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-500/10 animate-in fade-in duration-300">
          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-300">
              Alerta de Autenticação
            </span>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 leading-relaxed">
              Foram detectados erros de sessão/cookie nas últimas 24h. Verifique se os cookies do Facebook Groups (ou outras fontes autenticadas) estão válidos e atualizados.
            </p>
          </div>
        </div>
      )}

      {/* Recent Runs Summary */}
      {!loading && runs.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-mono uppercase text-zinc-500 dark:text-zinc-400 tracking-wider">
            Últimos Ciclos
          </span>
          <div className="space-y-1.5">
            {runs.map((run) => {
              const total = run.totalLogs || 1;
              const errPct = ((run.errorCount / total) * 100).toFixed(0);
              const started = new Date(run.startedAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={run.runId}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-xs font-mono"
                >
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    <span>{started}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-zinc-600 dark:text-zinc-300">
                      {run.totalLogs} logs
                    </span>
                    <span className={cn(
                      'font-semibold',
                      run.errorCount === 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : run.errorCount <= 3
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}>
                      {run.errorCount === 0 ? '✓ OK' : `${run.errorCount} erros (${errPct}%)`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && runs.length === 0 && (
        <div className="text-center py-4 text-zinc-500 dark:text-zinc-400 text-xs font-mono">
          Nenhum ciclo de execução registrado recentemente.
        </div>
      )}
    </div>
  );
}
