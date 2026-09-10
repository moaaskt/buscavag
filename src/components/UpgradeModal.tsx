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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-500/40 bg-zinc-950 p-6 md:p-8 shadow-2xl shadow-emerald-950/40 overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-emerald-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-amber-500/15 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-mono text-amber-300 font-semibold mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Buscavag Premium Pro</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Billing Switch */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'flex items-center gap-1 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all',
                billingPeriod === 'annual'
                  ? 'bg-emerald-600 text-zinc-950 font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              )}
            >
              <span>Anual</span>
              <span className="rounded bg-amber-400/20 text-amber-300 px-1.5 py-0.2 text-[9px] uppercase font-mono font-bold">
                -45%
              </span>
            </button>
          </div>
        </div>

        {/* Price Card Preview */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 mb-6 text-center relative overflow-hidden">
          <div className="text-2xl md:text-3xl font-extrabold text-zinc-100 font-mono">
            {billingPeriod === 'annual' ? 'R$ 16,65' : 'R$ 29,90'}
            <span className="text-xs text-zinc-400 font-normal font-sans"> /mês</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-0.5">
            {billingPeriod === 'annual'
              ? 'Faturado anualmente por R$ 199,90'
              : 'Cobrado mensalmente, cancele quando quiser'}
          </div>
        </div>

        {/* Features list */}
        <div className="space-y-2.5 mb-6 text-xs text-zinc-300">
          {[
            'Todas as centenas de Vagas Recomendadas com Match IA desbloqueadas',
            'Salvamento e acompanhamento de vagas ilimitadas',
            'Diagnósticos e reanálises de currículo com IA ilimitadas',
            'Dicas personalizadas de otimização para sistemas ATS',
            'Alertas prioritários de novas vagas altamente compatíveis',
          ].map((feature, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <div className="rounded-full bg-emerald-500/15 p-0.5 text-emerald-400 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-xs text-rose-300 text-center">
            {error}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold py-3 px-4 text-sm shadow-xl shadow-emerald-950/60 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ativando Plano Pro...</span>
            </>
          ) : (
            <>
              <span>Ativar Plano Premium Agora</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Garantia de 7 dias ou seu dinheiro de volta • Sem compromisso</span>
        </div>
      </div>
    </div>
  );
}
