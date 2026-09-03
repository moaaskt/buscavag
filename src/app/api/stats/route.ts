import { NextResponse } from 'next/server';
import { JobRepository } from '@/db/repository';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const repo = new JobRepository();
    const stats = repo.getStats();
    return NextResponse.json({ success: true, data: stats });
  } catch (error) {
    console.error('[API /api/stats error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
