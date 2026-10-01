'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { VelzonCard } from '@/components/admin/ui/VelzonCard';
import { VelzonBadge } from '@/components/admin/ui/VelzonBadge';
import { VelzonStatWidget } from '@/components/admin/ui/VelzonStatWidget';
import { VelzonModal } from '@/components/admin/ui/VelzonModal';
import { VelzonInput } from '@/components/admin/ui/VelzonInput';
import { VelzonSelect } from '@/components/admin/ui/VelzonSelect';
import {
  Cpu,
  RefreshCw,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  Loader2,
  Clock,
  Layers,
  Filter,
  SlidersHorizontal,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { ScraperConfigEntry, ScraperMethod } from '@/db/adminScraperRepository';

export default function AdminScrapersPage() {
  const [configs, setConfigs] = useState<ScraperConfigEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | ScraperMethod>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Estados de ações
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncingScraperName, setSyncingScraperName] = useState<string | null>(null);
  const [selectedSingleScraper, setSelectedSingleScraper] = useState('');
  const [isPurging, setIsPurging] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  // Toast / feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/scraper/config');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConfigs(data.data);
        if (data.data.length > 0 && !selectedSingleScraper) {
          setSelectedSingleScraper(data.data[0].name);
        }
      } else {
        showToast('error', data.error || 'Erro ao carregar configurações');
      }
    } catch (err: any) {
      console.error('[AdminScrapersPage] Erro ao buscar configs:', err);
      showToast('error', 'Falha na conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Alternar ativação de conector
  const handleToggle = async (scraper: ScraperConfigEntry) => {
    const nextState = scraper.is_enabled === 1 ? false : true;
    const previousConfigs = [...configs];

    // Atualização otimista
    setConfigs((prev) =>
      prev.map((c) => (c.name === scraper.name ? { ...c, is_enabled: nextState ? 1 : 0 } : c))
    );

    try {
      const res = await fetch('/api/admin/scraper/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: scraper.name, is_enabled: nextState }),
      });
      const data = await res.json();
      if (!data.success) {
        setConfigs(previousConfigs);
        showToast('error', data.error || `Erro ao atualizar conector ${scraper.name}`);
      } else {
        showToast(
          'success',
          `Conector ${scraper.name} ${nextState ? 'ativado' : 'desativado'} com sucesso!`
        );
      }
    } catch (err: any) {
      setConfigs(previousConfigs);
      showToast('error', `Falha ao alternar conector ${scraper.name}`);
    }
  };

  // Disparo global
  const handleSyncAll = async () => {
    setIsSyncingAll(true);
    showToast('info', 'Iniciando sincronização global de todos os conectores...');
    try {
      const res = await fetch('/api/admin/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Pipeline global disparado com sucesso! (Run ID: ${data.runId})`);
      } else {
        showToast('error', data.error || 'Erro ao iniciar pipeline');
      }
    } catch (err: any) {
      showToast('error', 'Falha na requisição de sincronização');
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Disparo individual
  const handleSyncSingle = async (name: string) => {
    if (!name) return;
    setSyncingScraperName(name);
    showToast('info', `Iniciando conector individual: ${name}...`);
    try {
      const res = await fetch('/api/admin/scraper/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scraperName: name }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Conector "${name}" disparado com sucesso! (Run ID: ${data.runId})`);
      } else {
        showToast('error', data.error || `Erro ao disparar conector ${name}`);
      }
    } catch (err: any) {
      showToast('error', `Falha na execução do conector ${name}`);
    } finally {
      setSyncingScraperName(null);
    }
  };

  // Expurgo de vagas rejeitadas
  const handlePurge = async () => {
    setIsPurging(true);
    try {
      const res = await fetch('/api/admin/jobs/purge-non-tech', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Expurgo concluído! ${data.purgedCount} vagas rejeitadas foram eliminadas.`);
        setShowPurgeModal(false);
      } else {
        showToast('error', data.error || 'Erro ao executar expurgo');
      }
    } catch (err: any) {
      showToast('error', 'Falha ao processar expurgo de vagas');
    } finally {
      setIsPurging(false);
    }
  };

  // Métricas calculadas
  const totalScrapers = configs.length;
  const activeScrapers = configs.filter((c) => c.is_enabled === 1).length;
  const inactiveScrapers = totalScrapers - activeScrapers;
  const healthRate = totalScrapers > 0 ? Math.round((activeScrapers / totalScrapers) * 100) : 0;

  // Filtragem
  const filteredConfigs = useMemo(() => {
    return configs.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.target_url && c.target_url.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesMethod = methodFilter === 'all' || c.method === methodFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && c.is_enabled === 1) ||
        (statusFilter === 'inactive' && c.is_enabled === 0);
      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [configs, searchTerm, methodFilter, statusFilter]);

  const methodBadgeVariant = (method: ScraperMethod) => {
    switch (method) {
      case 'playwright':
        return 'primary';
      case 'ssr':
        return 'info';
      case 'api':
        return 'success';
      case 'cookie':
        return 'warning';
      default:
        return 'dark';
    }
  };

  return (
    <AdminLayout>
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-700 dark:text-emerald-200'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-950/80 dark:border-rose-700 dark:text-rose-200'
              : 'bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-950/80 dark:border-indigo-700 dark:text-indigo-200'
          }`}
        >
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          {toast.type === 'error' && <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
          {toast.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e9ebec] dark:border-slate-800">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-[#405189]" />
            Central de Scrapers & Ingestão
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            Governança operacional de conectores, execução manual, toggles de ativação e expurgo de dados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/logs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            Logs de Auditoria
          </Link>
          <button
            onClick={fetchConfigs}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Lista
          </button>
        </div>
      </div>

      {/* Widgets Estatísticos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <VelzonStatWidget
          title="Total de Conectores"
          value={totalScrapers}
          icon={<Cpu className="w-6 h-6 text-[#405189]" />}
          variant="primary"
          trend={{ value: `${totalScrapers} fontes mapeadas`, isPositive: true }}
        />
        <VelzonStatWidget
          title="Conectores Ativos"
          value={activeScrapers}
          icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />}
          variant="success"
          trend={{ value: `${healthRate}% operacionais`, isPositive: healthRate >= 80 }}
        />
        <VelzonStatWidget
          title="Conectores Desativados"
          value={inactiveScrapers}
          icon={<AlertTriangle className="w-6 h-6 text-amber-500" />}
          variant="warning"
          trend={{ value: inactiveScrapers === 0 ? 'Nenhum conector pausado' : `${inactiveScrapers} pausados`, isPositive: inactiveScrapers === 0 }}
        />
        <VelzonStatWidget
          title="Métodos de Ingestão"
          value="4 Tipos"
          icon={<Layers className="w-6 h-6 text-sky-500" />}
          variant="info"
          trend={{ value: 'Playwright, SSR, API, Cookie' }}
        />
      </div>

      {/* Painel de Controle Operacional (Ações Globais e Unitárias) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        {/* Card 1: Disparo Global */}
        <VelzonCard
          title="Sincronização Global"
          subtitle="Executar todos os conectores ativos simultaneamente"
          className="border-t-4 border-t-[#405189]"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Inicia o pipeline autônomo com concorrência paralela e timeout supervisionado para todas as fontes habilitadas.
          </p>
          <button
            onClick={handleSyncAll}
            disabled={isSyncingAll}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#405189] hover:bg-[#364473] text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
          >
            {isSyncingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sincronizando Todas as Fontes...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sincronizar Todas as Fontes
              </>
            )}
          </button>
        </VelzonCard>

        {/* Card 2: Disparo Individual */}
        <VelzonCard
          title="Execução Granular"
          subtitle="Disparar um único conector sob demanda"
          className="border-t-4 border-t-sky-500"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
            Selecione uma fonte específica para testar a captura ou forçar atualização isolada:
          </p>
          <div className="space-y-3">
            <VelzonSelect
              value={selectedSingleScraper}
              onChange={(e) => setSelectedSingleScraper(e.target.value)}
              className="text-xs"
            >
              {configs.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.method.toUpperCase()}) {c.is_enabled === 0 ? '[DESATIVADO]' : ''}
                </option>
              ))}
            </VelzonSelect>

            <button
              onClick={() => handleSyncSingle(selectedSingleScraper)}
              disabled={!selectedSingleScraper || syncingScraperName === selectedSingleScraper}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition shadow-sm disabled:opacity-50"
            >
              {syncingScraperName === selectedSingleScraper ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executando {selectedSingleScraper}...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Disparar Conector Selecionado
                </>
              )}
            </button>
          </div>
        </VelzonCard>

        {/* Card 3: Expurgo Operacional */}
        <VelzonCard
          title="Expurgo & Limpeza"
          subtitle="Higienização do banco de dados e expurgo de ruído"
          className="border-t-4 border-t-rose-500"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
            Remove permanentemente vagas rejeitadas por filtros não-tech e ruídos de scraping, liberando espaço e otimizando consultas.
          </p>
          <button
            onClick={() => setShowPurgeModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 font-medium text-sm transition shadow-sm"
          >
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Expurgar Vagas Rejeitadas
          </button>
        </VelzonCard>
      </div>

      {/* Gestão e Lista de Conectores */}
      <div className="mt-8">
        <VelzonCard
          title={`Lista de Conectores (${filteredConfigs.length} de ${totalScrapers})`}
          subtitle="Ative, desative e controle a governança individual de cada scraper"
          actions={
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Busca Textual */}
              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar conector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#405189]"
                />
              </div>

              {/* Filtro Método */}
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="all">Todos os Métodos</option>
                <option value="playwright">Playwright Stealth</option>
                <option value="ssr">SSR / Cheerio</option>
                <option value="api">API / REST</option>
                <option value="cookie">Sessão / Cookie</option>
              </select>

              {/* Filtro Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Somente Ativos</option>
                <option value="inactive">Somente Desativados</option>
              </select>
            </div>
          }
        >
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#405189] mb-2" />
              <p className="text-xs font-mono">Carregando governança de conectores...</p>
            </div>
          ) : filteredConfigs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400">
              <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium">Nenhum conector encontrado para os filtros selecionados.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setMethodFilter('all');
                  setStatusFilter('all');
                }}
                className="mt-2 text-xs text-[#405189] hover:underline font-semibold"
              >
                Limpar Filtros
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 uppercase font-mono tracking-wider">
                    <th className="py-3 px-4">Conector</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">URL Alvo</th>
                    <th className="py-3 px-4">Timeout</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-sans">
                  {filteredConfigs.map((scraper) => {
                    const isEnabled = scraper.is_enabled === 1;
                    const isRunning = syncingScraperName === scraper.name;

                    return (
                      <tr
                        key={scraper.name}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition ${
                          !isEnabled ? 'opacity-65 bg-slate-50/30 dark:bg-slate-900/20' : ''
                        }`}
                      >
                        {/* Nome do Conector */}
                        <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isEnabled ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
                              }`}
                            />
                            <span className="font-semibold text-sm">{scraper.name}</span>
                          </div>
                        </td>

                        {/* Método */}
                        <td className="py-3.5 px-4">
                          <VelzonBadge variant={methodBadgeVariant(scraper.method)} size="sm">
                            {scraper.method.toUpperCase()}
                          </VelzonBadge>
                        </td>

                        {/* URL Alvo */}
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px] truncate max-w-xs">
                          {scraper.target_url ? (
                            <a
                              href={scraper.target_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 hover:text-[#405189] dark:hover:text-indigo-400 transition"
                            >
                              <span className="truncate">{scraper.target_url}</span>
                              <ExternalLink className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Timeout */}
                        <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 text-xs">
                          {scraper.timeout_ms ? `${scraper.timeout_ms / 1000}s` : '45s'}
                        </td>

                        {/* Toggle de Ativação */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => handleToggle(scraper)}
                            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isEnabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* Ações */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleSyncSingle(scraper.name)}
                            disabled={isRunning}
                            title={`Disparar ${scraper.name} agora`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-[#405189]/10 text-[#405189] dark:bg-[#405189]/25 dark:text-indigo-300 hover:bg-[#405189]/20 transition disabled:opacity-50"
                          >
                            {isRunning ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3" />
                            )}
                            Disparar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </VelzonCard>
      </div>

      {/* Modal de Expurgo Seguro */}
      <VelzonModal
        isOpen={showPurgeModal}
        onClose={() => setShowPurgeModal(false)}
        title="Confirmar Expurgo de Vagas Rejeitadas"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowPurgeModal(false)}
              disabled={isPurging}
              className="px-3.5 py-2 text-xs font-semibold rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              onClick={handlePurge}
              disabled={isPurging}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50 shadow-sm"
            >
              {isPurging ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Expurgando Registros...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Confirmar e Expurgar
                </>
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-3 py-2">
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
            <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              <strong className="block font-semibold mb-1">Ação Irreversível de Limpeza</strong>
              Esta operação realizará um hard delete de todas as vagas marcadas como ruído ou rejeitadas pelos filtros semânticos não-tech.
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Recomendado para otimizar o índice do banco de dados SQLite e manter apenas oportunidades estritamente válidas. Deseja prosseguir com o expurgo?
          </p>
        </div>
      </VelzonModal>
    </AdminLayout>
  );
}
