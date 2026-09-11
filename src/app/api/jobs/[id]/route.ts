import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/db/repository';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da vaga não fornecido.' },
        { status: 400 }
      );
    }

    const repo = new JobRepository();
    const deleted = repo.deleteJobs([id]);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Vaga não encontrada.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('[API /api/jobs/[id] DELETE error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
