'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ScraperTerminalModal } from '@/components/ScraperTerminalModal';
import { DashboardStats } from '@/db/repository';
import { PlatformDistribution } from '@/components/admin/PlatformDistribution';
import { ScraperHealthMonitor } from '@/components/admin/ScraperHealthMonitor';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { VelzonCard } from '@/components/admin/ui/VelzonCard';
import { VelzonStatWidget } from '@/components/admin/ui/VelzonStatWidget';
import { VelzonBadge } from '@/components/admin/ui/VelzonBadge';
import {
  ShieldCheck,
  Terminal,
  Trash2,
  Activity,
  Database,
  RefreshCw,
  Server,
  Zap,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

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

  const totalJobs = stats?.totalJobs ?? 0;
  const approvedJobs = stats?.approvedJobs ?? 0;
  const noiseJobs = Math.max(0, totalJobs - approvedJobs);
  const approvalRate = totalJobs ? Math.round((approvedJobs / totalJobs) * 100) : 0;

  return (
    <AdminLayout>
      {/* Top Banner & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e9ebec] dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Painel Geral de Operações
            <VelzonBadge variant="primary" size="sm">
              Velzon UI
            </VelzonBadge>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Infraestrutura de coleta, inteligência de triagem e saúde dos motores.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStats}
            disabled={loadingStats}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-[#e9ebec] dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
            <span>Atualizar Métricas</span>
          </button>
        </div>
      </div>

      {/* Top Stat KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <VelzonStatWidget
          title="Total Coletadas"
          value={loadingStats ? '...' : totalJobs.toLocaleString('pt-BR')}
          icon={<Database className="w-6 h-6" />}
          variant="primary"
          trend={{ value: `${Object.keys(stats?.platformCounts || {}).length} canais`, label: 'mapeados' }}
        />
        <VelzonStatWidget
          title="Vagas Aprovadas"
          value={loadingStats ? '...' : approvedJobs.toLocaleString('pt-BR')}
          icon={<CheckCircle2 className="w-6 h-6" />}
          variant="success"
          trend={{ value: `${approvalRate}%`, isPositive: true, label: 'taxa de fit' }}
        />
        <VelzonStatWidget
          title="Ruído / Descarte"
          value={loadingStats ? '...' : noiseJobs.toLocaleString('pt-BR')}
          icon={<Trash2 className="w-6 h-6" />}
          variant="danger"
          trend={{ value: 'Hard Delete', label: 'disponível' }}
        />
        <VelzonStatWidget
          title="Eficiência IA"
          value={loadingStats ? '...' : `${approvalRate}%`}
          icon={<Zap className="w-6 h-6" />}
          variant="info"
          trend={{ value: 'Hermes AI', isPositive: true, label: 'online' }}
        />
      </div>

      {/* Main Grid: Operational Controls & Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Coluna Esquerda: Ações Operacionais */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Card de Controle de Infraestrutura */}
          <VelzonCard
            title="Controle de Varredura & Limpeza"
            subtitle="Gerenciamento de disparos manuais e manutenção de disco"
            badge={
              <VelzonBadge variant="success" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                Sessão Ativa
              </VelzonBadge>
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Sincronização */}
              <div className="p-4 rounded-lg border border-[#e9ebec] dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-4 h-4 text-[#405189]" />
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                      Disparo de Scrapers
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Inicia os scrapers ativos em paralelo via SSE stream.
                  </p>
                </div>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#405189] hover:bg-[#364574] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSyncing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Iniciar Varredura</span>
                </button>
              </div>

              {/* Purga de Rejeitadas */}
              <div className="p-4 rounded-lg border border-[#e9ebec] dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="w-4 h-4 text-rose-500" />
                    <h4 className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                      Expurgo Imediato
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Executa exclusão de vagas marcadas como ruído ou não-tech.
                  </p>
                </div>
                <button
                  onClick={handlePurge}
                  disabled={isPurging}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isPurging ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Executar Hard Delete</span>
                </button>
              </div>
            </div>
          </VelzonCard>

          {/* Card: Monitor de Saúde dos Scrapers */}
          <VelzonCard
            title="Monitor de Saúde dos Scrapers"
            subtitle="Taxa de sucesso, latência e status dos conectores de coleta"
          >
            <ScraperHealthMonitor />
          </VelzonCard>
        </div>

        {/* Coluna Direita: Analytics & Atalhos */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Card: Distribuição por Plataforma */}
          <VelzonCard
            title="Distribuição por Canal"
            subtitle="Volume de vagas coletadas por fonte"
          >
            {loadingStats ? (
              <div className="py-8 flex justify-center">
                <RefreshCw className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : (
              <PlatformDistribution platformCounts={stats?.platformCounts || {}} />
            )}
          </VelzonCard>

          {/* Card: Atalho para Logs */}
          <VelzonCard
            title="Auditoria & Logs do Sistema"
            subtitle="Histórico operacional unificado"
          >
            <div className="space-y-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                Acesse a trilha de eventos do sistema, tentativas de login, logs de scrapers e alertas.
              </p>
              <Link
                href="/admin/logs"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <Terminal className="w-4 h-4" />
                <span>Abrir Central de Logs</span>
              </Link>
            </div>
          </VelzonCard>

          {/* Card Informativo de Segurança */}
          <div className="p-4 rounded-lg bg-[#405189]/5 border border-[#405189]/20 space-y-1.5">
            <div className="flex items-center gap-2 text-[#405189] dark:text-indigo-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Sessão Isolada & Protegida</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              O ecossistema administrativo opera com token dedicado <code>admin_session</code> assinado com <code>ADMIN_JWT_SECRET</code>, dissociado da autenticação de candidatos.
            </p>
          </div>
        </div>
      </div>

      <ScraperTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />
    </AdminLayout>
  );
}
