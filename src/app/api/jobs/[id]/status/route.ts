import { NextRequest, NextResponse } from 'next/server';
import { CandidateRepository } from '@/db/candidateRepository';
import { getSessionUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(request);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'applied', 'interview', 'offer', 'rejected', 'saved'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido. Deve ser um de: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const repo = new CandidateRepository();
    const updated = repo.updateSavedJobStatus(session.userId, id, status);

    if (!updated) {
      repo.toggleSavedJob(session.userId, id, status);
    }

    return NextResponse.json({ success: true, id, status });
  } catch (error) {
    console.error('[API /api/jobs/[id]/status error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
