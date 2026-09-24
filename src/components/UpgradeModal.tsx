'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  Crown,
  X,
  Zap,
  ShieldCheck,
  ArrowRight,
  Loader2,
  Flame
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

export function UpgradeModal({
  isOpen,
  onClose,
  title = 'Desbloqueie o Poder Máximo com o Plano Pro',
  description = 'Obtenha recomendações ilimitadas com IA, vagas salvas sem restrições e análises aprofundadas de currículo.',
  onSuccess,
}: UpgradeModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/saas/upgrade', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        window.dispatchEvent(new CustomEvent('buscavag:auth-changed'));
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.error || 'Falha ao processar ativação do plano');
      }
    } catch {
      setError('Erro de conexão ao ativar o plano');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 md:p-8 shadow-xl overflow-hidden">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar modal"
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-0.5 text-xs text-amber-700 dark:text-amber-400 font-medium mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Buscavag Premium Pro</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Billing Switch */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center p-1 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-3.5 py-1 text-xs font-medium rounded-md transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'flex items-center gap-1 px-3.5 py-1 text-xs font-medium rounded-md transition-all',
                billingPeriod === 'annual'
                  ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <span>Anual</span>
              <span className="rounded bg-amber-400/20 text-amber-700 dark:text-amber-300 px-1 py-0.2 text-[9px] uppercase font-mono font-bold">
                -45%
              </span>
            </button>
          </div>
        </div>

        {/* Price Card Preview */}
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 p-4 mb-6 text-center">
          <div className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 font-mono">
            {billingPeriod === 'annual' ? 'R$ 16,65' : 'R$ 29,90'}
            <span className="text-xs text-zinc-500 font-normal font-sans"> /mês</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1">
            {billingPeriod === 'annual'
              ? 'Faturado anualmente por R$ 199,90'
              : 'Cobrado mensalmente, cancele quando quiser'}
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-2.5 mb-6 text-xs text-zinc-600 dark:text-zinc-300">
          {[
            'Acesso irrestrito a todas as recomendações com Match IA',
            'Salvamento e acompanhamento de vagas ilimitadas',
            'Diagnósticos e reanálises de currículo com IA ilimitadas',
            'Dicas de compatibilidade e otimização para sistemas ATS',
            'Alertas prioritários de novas oportunidades compatíveis',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 p-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span className="leading-snug">{feature}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-2.5 text-xs text-rose-700 dark:text-rose-300 text-center">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 text-sm transition-colors active:scale-[0.99] disabled:opacity-50 shadow-xs"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ativando Plano Pro...</span>
            </>
          ) : (
            <>
              <span>Ativar Plano Premium Pro</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Garantia de 7 dias ou cancelamento sem compromisso</span>
        </div>
      </div>
    </div>
  );
}
