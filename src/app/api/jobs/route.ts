import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const platform = searchParams.get('platform') || undefined;
    const status = searchParams.get('status') || undefined;
    const minScore = searchParams.get('minScore') ? Number(searchParams.get('minScore')) : undefined;
    const search = searchParams.get('search') || undefined;
    const onlyApproved = searchParams.get('onlyApproved') === 'true';
    const period = searchParams.get('period') || undefined;
    const location = searchParams.get('location') || undefined;

    const repo = new JobRepository();
    const jobs = repo.getAllJobs({
      category,
      platform,
      status,
      minScore,
      search,
      onlyApproved,
      period,
      location,
    });


    return NextResponse.json({ success: true, count: jobs.length, data: jobs });
  } catch (error) {
    console.error('[API /api/jobs error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lista de IDs inválida ou vazia.' },
        { status: 400 }
      );
    }

    const repo = new JobRepository();
    const deleted = repo.deleteJobs(ids);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Nenhuma vaga foi encontrada para exclusão.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('[API /api/jobs DELETE error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
