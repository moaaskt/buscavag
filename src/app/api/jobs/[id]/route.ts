import { NextRequest, NextResponse } from 'next/server';
import { JobRepository } from '@/db/repository';
import { CandidateRepository } from '@/db/candidateRepository';
import { getSessionUser } from '@/lib/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionUser(request);
    if (!session?.userId) {
      logger.security('jobs', 'Tentativa de exclusão individual sem autenticação', { req: request });
      return NextResponse.json(
        { success: false, error: 'Apenas usuários autenticados podem gerenciar ou ocultar vagas.' },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da vaga não fornecido.' },
        { status: 400 }
      );
    }

    // Se for Administrador, realiza exclusão física no banco global
    if (session.role === 'ADMIN') {
      const repo = new JobRepository();
      const deleted = repo.deleteJobs([id]);

      if (!deleted) {
        return NextResponse.json(
          { success: false, error: 'Vaga não encontrada para exclusão.' },
          { status: 404 }
        );
      }

      logger.info('jobs', `Admin ${session.email} excluiu permanentemente a vaga ${id}`, {
        userId: session.userId,
        metadata: { jobId: id },
        req: request,
      });

      return NextResponse.json({ success: true, id, action: 'deleted' });
    }

    // Se for Candidato/Usuário regular, oculta a vaga apenas para seu perfil
    const candidateRepo = new CandidateRepository();
    candidateRepo.hideJobs(session.userId, [id]);

    logger.info('jobs', `Usuário ${session.email} ocultou a vaga ${id}`, {
      userId: session.userId,
      metadata: { jobId: id },
      req: request,
    });

    return NextResponse.json({ success: true, id, action: 'hidden' });
  } catch (error) {
    logger.error('jobs', 'Erro no processamento de /api/jobs/[id] DELETE', {
      metadata: { error: (error as Error).message },
      req: request,
    });
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

