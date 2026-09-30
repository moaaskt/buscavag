import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminPaymentRepository } from '@/db/adminPaymentRepository';
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
        { success: false, error: 'ID de transação não informado' },
        { status: 400 }
      );
    }

    const repo = new AdminPaymentRepository();
    const payment = repo.getPaymentDetail(id);

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Transação não encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (err: any) {
    console.error('[API Admin Pagamento Detail Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao consultar detalhes da transação' },
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
        { success: false, error: 'ID de transação não informado' },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const repo = new AdminPaymentRepository();

    // 1. Estorno / Reembolso
    if (body.action === 'refund') {
      const reason = body.reason || 'Solicitação de estorno pelo suporte administrativo';
      const result = repo.refundPayment(id, reason, sessionData.user);

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Falha ao estornar pagamento ou transação inexistente' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ...result,
        message: 'Pagamento estornado com sucesso e assinatura revertida',
      });
    }

    // 2. Reenvio / Geração de Recibo
    if (body.action === 'resend_receipt') {
      const payment = repo.getPaymentDetail(id);
      if (!payment) {
        return NextResponse.json({ success: false, error: 'Transação não encontrada' }, { status: 404 });
      }

      logAdminAction(
        sessionData.user,
        `Reenvio de recibo da transação ${id} para ${payment.user_email}`,
        { paymentId: id, userEmail: payment.user_email, amount: payment.amount },
        req
      );

      return NextResponse.json({
        success: true,
        message: `Comprovante reenviado com sucesso para ${payment.user_email}`,
        receiptUrl: payment.invoice_url || `https://buscavag.com.br/faturas/${payment.id}`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Ação não suportada' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[API Admin Pagamento PATCH Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro ao processar ação na transação' },
      { status: 500 }
    );
  }
}
