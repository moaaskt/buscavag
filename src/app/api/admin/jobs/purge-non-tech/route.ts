import { NextResponse } from 'next/server';
import { JobRepository } from '@/db/repository';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const repo = new JobRepository();
    const result = repo.purgeNonTech();

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: `${result.deletedCount} vagas não-tech foram removidas do banco de dados com sucesso.`,
    });
  } catch (error) {
    console.error('[API /api/jobs/purge-non-tech error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
