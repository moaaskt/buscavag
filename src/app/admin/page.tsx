'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScraperTerminalModal } from '@/components/ScraperTerminalModal';
import { DashboardStats } from '@/db/repository';
import {
  ShieldAlert,
  Terminal,
  Trash2,
  Activity,
  Layers,
  Database,
  RefreshCw,
  Server,
  Zap,
} from 'lucide-react';
import { LoaderThree } from '@/components/ui/loader';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Actions states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setIsTerminalOpen(true);
    try {
      await fetch('/api/admin/scraper/run', { method: 'POST' });
      // The SSE stream will catch the events. 
    } catch (err) {
      console.error('Failed to start sync:', err);
    } finally {
      setIsSyncing(false);
      fetchStats();
    }
  };

  const handlePurge = async () => {
    if (!window.confirm('Tem certeza? Isso fará um hard delete de todas as vagas rejeitadas.')) return;
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/jobs/purge-non-tech', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`Sucesso! ${data.purgedCount} vagas expurgadas.`);
        fetchStats();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to purge:', err);
      alert('Falha na purga.');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                Painel Administrativo
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Central de operações, infraestrutura e auditoria do sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Ações Operacionais */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* Bloco de Infraestrutura */}
            <section className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-500" />
                  <h2 className="font-semibold">Controle de Infraestrutura</h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Gerenciamento de scrapers e manutenção do banco de dados.
                </p>
              </div>
              
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Ação: Sincronizar */}
                <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-medium text-sm">Sincronizar Fontes</h3>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Dispara os scrapers ativos para varrer novas vagas.
                    </p>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isSyncing ? <LoaderThree className="text-white w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                    <span>Iniciar Varredura</span>
                  </button>
                </div>

                {/* Ação: Purgar */}
                <div className="flex flex-col justify-between p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <h3 className="font-medium text-sm">Purgar Rejeitadas</h3>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Remove definitivamente vagas marcadas como ruído.
                    </p>
                  </div>
                  <button
                    onClick={handlePurge}
                    disabled={isPurging}
                    className="w-full flex items-center justify-center gap-2 h-9 rounded-lg border border-rose-500/50 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {isPurging ? <LoaderThree className="text-rose-500 w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                    <span>Executar Hard Delete</span>
                  </button>
                </div>
              </div>
            </section>

            {/* Bloco de Monitoramento */}
            <section className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/80">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-5 h-5 text-indigo-500" />
                      <h2 className="font-semibold">Auditoria & Logs</h2>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Análise de erros e eventos detalhados dos motores.
                    </p>
                  </div>
                  <Link
                    href="/admin/logs"
                    className="flex items-center gap-2 h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>Ver Central de Logs</span>
                  </Link>
                </div>
              </div>
            </section>

          </div>

          {/* Coluna Direita: System Stats Overview */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <Database className="w-5 h-5 text-zinc-500" />
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">System Overview</h2>
              </div>
              
              {loadingStats ? (
                <div className="py-8 flex justify-center">
                  <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Total Processadas</span>
                    <span className="font-mono font-medium">{stats?.totalJobs ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Total Aprovadas</span>
                    <span className="font-mono font-medium text-emerald-500">{stats?.approvedJobs ?? 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Ruídos (Descartadas)</span>
                    <span className="font-mono font-medium text-rose-500">
                      {Math.max(0, (stats?.totalJobs ?? 0) - (stats?.approvedJobs ?? 0))}
                    </span>
                  </div>
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Taxa de Aproveitamento</span>
                    <span className="font-mono font-medium">
                      {stats?.totalJobs ? Math.round(((stats.approvedJobs ?? 0) / stats.totalJobs) * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-500">Fontes Mapeadas</span>
                    <span className="font-mono font-medium">{Object.keys(stats?.platformCounts || {}).length}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                <Zap className="w-5 h-5" />
                <h3 className="font-semibold text-sm">Status do Sistema</h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Todas as rotas de API do Scraper e DB Purge estão agora protegidas sob o domínio <code>/api/admin/*</code> e requerem um token JWT com Role <code>ADMIN</code>.
              </p>
            </div>
          </div>
        </div>

        <ScraperTerminalModal 
          isOpen={isTerminalOpen} 
          onClose={() => setIsTerminalOpen(false)} 
        />
      </div>
    );
}
