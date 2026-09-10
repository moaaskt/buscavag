export interface PlanTierLimits {
  tier: 'free' | 'premium';
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  maxSavedJobs: number;
  maxRecommendedJobsUnlocked: number;
  unlimitedAiCvAnalysis: boolean;
  priorityMatching: boolean;
  exportJobs: boolean;
  features: string[];
}

export const SAAS_PLANS: Record<'free' | 'premium', PlanTierLimits> = {
  free: {
    tier: 'free',
    name: 'Plano Gratuito',
    priceMonthly: 0,
    priceAnnual: 0,
    maxSavedJobs: 5,
    maxRecommendedJobsUnlocked: 5,
    unlimitedAiCvAnalysis: false,
    priorityMatching: false,
    exportJobs: false,
    features: [
      'Acesso ao Explorador de Vagas das 34 fontes',
      'Até 5 vagas salvas / favoritadas',
      'Top 5 Vagas Recomendadas com Match IA',
      '1 Diagnóstico de Currículo com IA por mês',
      'Filtros por Localização e Senioridade',
    ],
  },
  premium: {
    tier: 'premium',
    name: 'Plano Premium Pro',
    priceMonthly: 29.90,
    priceAnnual: 199.90,
    maxSavedJobs: Infinity,
    maxRecommendedJobsUnlocked: Infinity,
    unlimitedAiCvAnalysis: true,
    priorityMatching: true,
    exportJobs: true,
    features: [
      'Todas as centenas de Vagas Recomendadas desbloqueadas',
      'Vagas salvas ilimitadas',
      'Diagnósticos e reanálises de currículo com IA ilimitadas',
      'Dicas e recomendações personalizadas para ATS',
      'Alerta de Super Matches prioritários em tempo real',
      'Selo Pro no perfil do candidato',
      'Exportação de relatórios de candidaturas',
      'Suporte prioritário',
    ],
  },
};

export function getTierLimits(tier: 'free' | 'premium' | string): PlanTierLimits {
  if (tier === 'premium') return SAAS_PLANS.premium;
  return SAAS_PLANS.free;
}

export function canUserSaveMoreJobs(currentSavedCount: number, tier: 'free' | 'premium' | string): {
  allowed: boolean;
  maxAllowed: number;
  currentCount: number;
} {
  const limits = getTierLimits(tier);
  const allowed = currentSavedCount < limits.maxSavedJobs;
  return {
    allowed,
    maxAllowed: limits.maxSavedJobs,
    currentCount: currentSavedCount,
  };
}
