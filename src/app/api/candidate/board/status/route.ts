import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';

const statusSchema = z.object({
  jobId: z.string().min(1, 'ID da vaga é obrigatório'),
  status: z.string().min(1, 'Status é obrigatório'),
});

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.format() }, { status: 400 });
    }

    const repo = new CandidateRepository();
    // This will update the status on user_saved_jobs without toggling it off if it matches
    const updated = repo.updateSavedJobStatus(session.userId, parsed.data.jobId, parsed.data.status);

    if (!updated) {
      // If it doesn't exist, we fallback to toggle (which inserts it)
      repo.toggleSavedJob(session.userId, parsed.data.jobId, parsed.data.status);
    }

    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    console.error('Error in PATCH /api/candidate/board/status:', error);
    return NextResponse.json({ error: 'Erro ao atualizar status da vaga' }, { status: 500 });
  }
}
