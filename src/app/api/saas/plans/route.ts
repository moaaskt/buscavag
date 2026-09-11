import { NextResponse } from 'next/server';
import { SAAS_PLANS } from '@/lib/saasLimits';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      plans: SAAS_PLANS,
      comparison: [
        { feature: 'Explorador de Vagas (34 fontes)', free: 'Ilimitado', premium: 'Ilimitado' },
        { feature: 'Vagas Salvas / Favoritadas', free: 'Até 5 vagas', premium: 'Ilimitado' },
        { feature: 'Vagas Recomendadas (Match IA)', free: 'Top 5 vagas', premium: 'Todas desbloqueadas' },
        { feature: 'Análise de CV com IA (PDF/Word)', free: '1 por mês', premium: 'Ilimitado' },
        { feature: 'Dicas de Otimização ATS', free: 'Básicas', premium: 'Aprofundadas por vaga' },
        { feature: 'Selo Pro no Perfil', free: false, premium: true },
        { feature: 'Alertas de Super Match em tempo real', free: false, premium: true },
        { feature: 'Suporte Prioritário', free: false, premium: true },
      ],
    });
  } catch (error: any) {
    console.error('Error in GET /api/saas/plans:', error);
    return NextResponse.json({ success: false, error: 'Erro ao listar planos' }, { status: 500 });
  }
}
