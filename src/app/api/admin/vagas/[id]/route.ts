import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminJobRepository } from '@/db/adminJobRepository';
import { logAdminAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da vaga não informado' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const repo = new AdminJobRepository();

    if (body.action === 'toggle_hide') {
      const result = repo.toggleJobHide(id);
      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Vaga não encontrada' },
          { status: 404 }
        );
      }

      logAdminAction(
        sessionData.user,
        `Alteração de visibilidade da vaga para ${result.newStatus}`,
        { jobId: id, previousStatus: result.previousStatus, newStatus: result.newStatus },
        req
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Edição rápida de campos
    const updated = repo.updateJob(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Nenhum campo foi alterado ou vaga não encontrada' },
        { status: 400 }
      );
    }

    logAdminAction(
      sessionData.user,
      'Edição rápida de vaga',
      { jobId: id, updatedFields: Object.keys(body) },
      req
    );

    return NextResponse.json({
      success: true,
      message: 'Vaga atualizada com sucesso',
    });
  } catch (err: any) {
    console.error('[API Admin Vagas PATCH Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao atualizar vaga' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID da vaga não informado' },
        { status: 400 }
      );
    }

    const repo = new AdminJobRepository();
    const deleted = repo.deleteJobPermanent(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Vaga não encontrada' },
        { status: 404 }
      );
    }

    logAdminAction(
      sessionData.user,
      'Exclusão definitiva de vaga',
      { jobId: id },
      req
    );

    return NextResponse.json({
      success: true,
      message: 'Vaga removida definitivamente do sistema',
    });
  } catch (err: any) {
    console.error('[API Admin Vagas DELETE Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao excluir vaga' },
      { status: 500 }
    );
  }
}
