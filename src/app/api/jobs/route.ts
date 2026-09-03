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

    const repo = new JobRepository();
    const jobs = repo.getAllJobs({
      category,
      platform,
      status,
      minScore,
      search,
      onlyApproved,
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
