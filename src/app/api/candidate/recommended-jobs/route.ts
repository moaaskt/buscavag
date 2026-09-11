import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : 0;
    const search = searchParams.get('search') || undefined;
    const workModel = searchParams.get('workModel') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 40;
    const offset = (page - 1) * limit;

    const repo = new CandidateRepository();
    const user = repo.getUserById(session.userId);
    const tier = user?.tier || session.tier || 'free';

    const result = repo.getRecommendedJobs(session.userId, {
      minScore,
      search,
      workModel,
      platform,
      limit,
      offset,
    });

    const isFree = tier === 'free';
    const processedItems = result.items.map((item, index) => {
      const isLocked = isFree && (offset + index >= 5);
      if (isLocked) {
        return {
          ...item,
          isLocked: true,
          job: {
            ...item.job,
            url: '#upgrade-required',
            description: item.job.description ? item.job.description.slice(0, 120) + '...' : '',
          },
          match: {
            ...item.match,
            matchReasoning: 'Oportunidade exclusiva com alta aderência técnica. Desbloqueie com o Plano Premium Pro.',
          },
        };
      }
      return {
        ...item,
        isLocked: false,
      };
    });

    return NextResponse.json({
      success: true,
      count: processedItems.length,
      totalCount: result.totalCount,
      tier,
      unlockedCount: isFree ? Math.min(5, processedItems.length) : processedItems.length,
      candidate: result.candidate,
      data: processedItems,
    });
  } catch (error: any) {
    console.error('Error in GET /api/candidate/recommended-jobs:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar vagas recomendadas' },
      { status: 500 }
    );
  }
}
