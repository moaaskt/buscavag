import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminUserRepository } from '@/db/adminUserRepository';
import { logAdminAction } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(
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
        { success: false, error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }

    const repo = new AdminUserRepository();
    const detail = repo.getUserDetail(id);

    if (!detail) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      detail,
    });
  } catch (err: any) {
    console.error('[API Admin Usuario Detail Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar detalhes do usuário' },
      { status: 500 }
    );
  }
}

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
        { success: false, error: 'ID de usuário não fornecido' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const repo = new AdminUserRepository();

    // 1. Alteração de Plano (Free ↔ Pro)
    if (body.action === 'change_tier') {
      const tier = body.tier === 'premium' ? 'premium' : 'free';
      const updated = repo.updateUserTier(id, tier);

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Falha ao atualizar plano do usuário' },
          { status: 404 }
        );
      }

      logAdminAction(
        sessionData.user,
        `Alteração de plano do usuário para ${tier.toUpperCase()}`,
        { targetUserId: id, newTier: tier },
        req
      );

      return NextResponse.json({
        success: true,
        message: `Plano atualizado com sucesso para ${tier === 'premium' ? 'Pro' : 'Free'}`,
        tier,
      });
    }

    // 2. Suspensão / Reativação
    if (body.action === 'toggle_status') {
      const result = repo.toggleUserSuspension(id);

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      logAdminAction(
        sessionData.user,
        `Alteração de status do usuário para ${result.newStatus.toUpperCase()}`,
        { targetUserId: id, previousStatus: result.previousStatus, newStatus: result.newStatus },
        req
      );

      return NextResponse.json({
        success: true,
        message: `Conta ${result.newStatus === 'suspended' ? 'suspensa' : 'reativada'} com sucesso`,
        ...result,
      });
    }

    // 3. Reset de Senha Administrativo
    if (body.action === 'reset_password') {
      const result = repo.resetUserPassword(id);

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      logAdminAction(
        sessionData.user,
        'Reset de senha temporária gerada pelo suporte',
        { targetUserId: id },
        req
      );

      return NextResponse.json({
        success: true,
        message: 'Senha temporária gerada com sucesso',
        tempPassword: result.tempPassword,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação não reconhecida' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[API Admin Usuario PATCH Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar ação de suporte' },
      { status: 500 }
    );
  }
}
