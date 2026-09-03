import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/db/repository';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'applied', 'interview', 'offer', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido. Deve ser um de: ' + validStatuses.join(', ') },
        { status: 400 }
      );
    }

    const repo = new JobRepository();
    const updated = repo.updateApplicationStatus(id, status);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Vaga não encontrada ou não atualizada' },
        { status: 404 }
      );
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
