import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

const toggleSchema = z.object({
  jobId: z.string().min(1, 'ID da vaga é obrigatório'),
  status: z.string().default('saved'),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const savedJobs = repo.getSavedJobs(session.userId);

    return NextResponse.json({ success: true, savedJobs });
  } catch (error) {
    console.error('Error in GET /api/candidate/saved-jobs:', error);
    return NextResponse.json({ error: 'Erro ao buscar vagas salvas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = toggleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 });
    }

    const repo = new CandidateRepository();
    const user = repo.getUserById(session.userId);
    const tier = user?.tier || session.tier || 'free';

    // Se estiver tentando salvar (e não remover), valida o limite
    const currentSaved = repo.getSavedJobs(session.userId);
    const isAlreadySaved = currentSaved.some((item) => item.job_id === parsed.data.jobId);

    if (!isAlreadySaved && tier === 'free' && currentSaved.length >= 5) {
      return NextResponse.json(
        {
          success: false,
          limitReached: true,
          maxAllowed: 5,
          error: 'Você atingiu o limite de 5 vagas salvas do Plano Gratuito.',
          message: 'Faça upgrade para o Plano Premium Pro para salvar vagas ilimitadas!',
        },
        { status: 403 }
      );
    }

    const result = repo.toggleSavedJob(session.userId, parsed.data.jobId, parsed.data.status);

    return NextResponse.json({
      success: true,
      isSaved: result.isSaved,
      status: result.status,
    });
  } catch (error) {
    console.error('Error in POST /api/candidate/saved-jobs:', error);
    return NextResponse.json({ error: 'Erro ao salvar/remover vaga' }, { status: 500 });
  }
}
