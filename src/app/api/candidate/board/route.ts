import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { CandidateRepository } from '@/db/candidateRepository';
import { ProcessedJob } from '@/types/job';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const repo = new CandidateRepository();
    const savedJobs = repo.getSavedJobs(session.userId);

    // Mapear para o formato ProcessedJob esperado pelo Kanban
    const boardJobs: ProcessedJob[] = savedJobs.map((record) => {
      return {
        id: record.job.id,
        url: record.job.url,
        title: record.job.title,
        company: record.job.company,
        platform: record.job.platform,
        description: '',
        publishedAt: new Date(record.job.published_at),
        location: record.job.location || undefined,
        scoreIa: record.job.score_ia,
        overallScore: record.job.overall_score,
        // Override do applicationStatus com o status específico do usuário (user_saved_jobs)
        applicationStatus: record.status as any,
        isJuniorFullStack: true, // required by ProcessedJob but irrelevant here
        createdAt: new Date(record.saved_at),
        gaps: [],
        notified: false,
      } as ProcessedJob;
    });

    return NextResponse.json({ success: true, data: boardJobs });
  } catch (error) {
    console.error('Error in GET /api/candidate/board:', error);
    return NextResponse.json({ error: 'Erro ao buscar vagas do kanban' }, { status: 500 });
  }
}
