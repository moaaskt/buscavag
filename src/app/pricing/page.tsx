'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Check,
  X,
  Crown,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
  Award,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { UpgradeModal } from '@/components/UpgradeModal';
import { cn } from '@/lib/utils';

interface PlanFeatureItem {
  feature: string;
  free: string | boolean;
  premium: string | boolean;
}

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setIsAuthenticated(true);
        setUserTier(data.user.tier || 'free');
      } else {
        setIsAuthenticated(false);
        setUserTier('free');
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('buscavag:auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('buscavag:auth-changed', handleAuthChange);
    };
  }, []);

  const comparisonFeatures: PlanFeatureItem[] = [
    { feature: 'Explorador de Vagas de 34 fontes', free: 'Ilimitado', premium: 'Ilimitado' },
    { feature: 'Vagas Salvas & Kanban', free: 'Até 5 vagas', premium: 'Ilimitado' },
    { feature: 'Vagas Recomendadas com Match IA', free: 'Top 5 vagas', premium: 'Todas desbloqueadas' },
    { feature: 'Cálculo de Aderência Ponderada (0-100%)', free: true, premium: true },
    { feature: 'Diagnóstico de CV com IA (PDF/Word)', free: '1 por mês', premium: 'Ilimitado' },
    { feature: 'Identificação de Hard & Soft Skills', free: true, premium: true },
    { feature: 'Sincronização de Skills com 1 clique', free: true, premium: true },
    { feature: 'Recomendações e Otimizações para ATS', free: 'Básico', premium: 'Aprofundado por vaga' },
    { feature: 'Selo Pro no Perfil', free: false, premium: true },
    { feature: 'Alertas de Super Match em tempo real', free: false, premium: true },
    { feature: 'Suporte Prioritário', free: false, premium: true },
  ];

  const faqs = [
    {
      q: 'Como funciona o Algoritmo de Match Perfeito?',
      a: 'Nosso motor de IA analisa o seu perfil e o texto extraído do seu currículo em 4 dimensões ponderadas: Stack Técnica (40%), Alinhamento de Cargo (25%), Senioridade (20%) e Modelo de Trabalho/Localização (15%), ranqueando as melhores oportunidades das 34 fontes.',
    },
    {
      q: 'Posso cancelar a assinatura quando quiser?',
      a: 'Sim! Não há fidelidade ou taxas de cancelamento. Você pode cancelar sua assinatura com 1 clique no painel a qualquer momento.',
    },
    {
      q: 'Quais formatos de currículo são suportados?',
      a: 'Suportamos documentos em formato PDF (.pdf) e Microsoft Word (.docx, .doc) de até 10MB.',
    },
    {
      q: 'Existe período de garantia?',
      a: 'Sim, oferecemos 7 dias de garantia incondicional de satisfação. Se não gostar, devolvemos 100% do valor.',
    },
  ];

  return (
    <div className="max-w-6xl w-full mx-auto space-y-12 py-4">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 dark:border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Planos Transparentes & Sem Pegadinhas</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight">
          Acelere sua contratação com{' '}
          <span className="bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
            Inteligência Artificial
          </span>
        </h1>
        <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 mt-4 leading-relaxed">
          Pare de aplicar manualmente para centenas de vagas aleatórias. Deixe o motor do Buscavag cruzar seu perfil com as melhores oportunidades em tempo real.
        </p>

        {/* Billing Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm dark:shadow-lg">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={cn(
                'px-5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all',
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              Cobrança Mensal
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={cn(
                'flex items-center gap-2 px-5 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all',
                billingPeriod === 'annual'
                  ? 'bg-emerald-600 text-zinc-950 font-bold shadow'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              )}
            >
              <span>Anual</span>
              <span className="rounded bg-amber-400/20 text-amber-500 dark:text-amber-300 px-2 py-0.5 text-[10px] uppercase font-mono font-bold">
                Economize 45%
              </span>
            </button>
          </div>
        </div>
      </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
          {/* Free Card */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-8 backdrop-blur-xl flex flex-col justify-between hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono uppercase text-zinc-500 dark:text-zinc-400 font-semibold">Gratuito</span>
                <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-0.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  Para Começar
                </span>
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">R$ 0</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">/para sempre</span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                Ideal para explorar a base de vagas e testar a análise básica de currículo.
              </p>

              <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800/80 space-y-3 text-xs text-zinc-600 dark:text-zinc-300">
                {[
                  'Acesso a todas as 34 fontes de vagas',
                  'Até 5 vagas salvas / favoritadas',
                  'Top 5 Vagas Recomendadas com Match IA',
                  '1 Diagnóstico de currículo com IA por mês',
                  'Filtros básicos por cidade e senioridade',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-zinc-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              <Link
                href={isAuthenticated ? '/candidate' : '/register'}
                className="w-full inline-flex items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-4 py-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors shadow-sm"
              >
                {isAuthenticated ? 'Acessar Meu Painel' : 'Criar Conta Gratuita'}
              </Link>
            </div>
          </div>

          {/* Premium Pro Card */}
          <div className="relative rounded-3xl border-2 border-emerald-500/50 dark:border-emerald-500/60 bg-gradient-to-b from-emerald-50/40 via-white to-white dark:from-zinc-900/90 dark:to-zinc-950 p-8 backdrop-blur-xl flex flex-col justify-between shadow-xl shadow-emerald-500/10 dark:shadow-2xl dark:shadow-emerald-950/50 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all">
            {/* Top Badge */}
            <div className="absolute -top-3.5 right-8">
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-3.5 py-1 text-[11px] font-bold text-zinc-950 uppercase tracking-wider shadow-md">
                <Crown className="w-3.5 h-3.5" /> Mais Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold uppercase text-emerald-600 dark:text-emerald-400">Premium Pro</span>
                <span className="rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-0.5 text-xs font-semibold">
                  Acesso Total
                </span>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-100 font-mono">
                  {billingPeriod === 'annual' ? 'R$ 16,65' : 'R$ 29,90'}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-sans">/mês</span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                {billingPeriod === 'annual'
                  ? 'Faturado anualmente por R$ 199,90 (Economia de 45%)'
                  : 'Faturado mensalmente com cancelamento a qualquer momento'}
              </p>

              <div className="mt-6 pt-6 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-3 text-xs text-zinc-700 dark:text-zinc-200">
                {[
                  'Todas as centenas de Vagas Recomendadas desbloqueadas',
                  'Vagas salvas e candidaturas ilimitadas',
                  'Análises e reanálises de currículo com IA ilimitadas',
                  'Dicas personalizadas de otimização para sistemas ATS',
                  'Alertas prioritários de novas vagas de Super Match',
                  'Selo Pro no perfil do candidato',
                  'Suporte prioritário via Telegram / E-mail',
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 p-0.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-medium text-zinc-700 dark:text-zinc-200">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4">
              {userTier === 'premium' ? (
                <button
                  disabled
                  className="w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 cursor-default"
                >
                  Plano Ativo no Seu Perfil ✓
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-bold py-3 px-4 text-sm shadow-xl shadow-emerald-500/20 dark:shadow-emerald-950/60 transition-all duration-200 active:scale-[0.98]"
                >
                  <span>Ativar Plano Pro Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabela Comparativa Detalhada */}
        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 p-6 md:p-10 backdrop-blur-xl mb-20 shadow-sm">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-8">
            Comparativo Completo de Recursos
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono uppercase text-[11px]">
                  <th className="py-3 px-4">Funcionalidade</th>
                  <th className="py-3 px-4 text-center">Plano Free</th>
                  <th className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">Plano Premium Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {comparisonFeatures.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-zinc-900 dark:text-zinc-100">{row.feature}</td>
                    <td className="py-3.5 px-4 text-center text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600 mx-auto" />
                        )
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-600 dark:text-emerald-300 font-mono text-xs font-semibold">
                      {typeof row.premium === 'boolean' ? (
                        row.premium ? (
                          <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-4 h-4 text-zinc-400 dark:text-zinc-600 mx-auto" />
                        )
                      ) : (
                        row.premium
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-zinc-100 text-center mb-8">
            Perguntas Frequentes
          </h2>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/40 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-4 md:p-5 text-left text-xs md:text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn('w-4 h-4 text-zinc-500 transition-transform duration-200', isOpen && 'rotate-180 text-emerald-500 dark:text-emerald-400')} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-5 md:px-5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-200/60 dark:border-zinc-800/50 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => {
          checkAuth();
        }}
      />
    </div>
  );
}
