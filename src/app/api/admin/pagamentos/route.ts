import { NextRequest, NextResponse } from 'next/server';
import { getAdminSessionUser } from '@/lib/admin-auth';
import { AdminPaymentRepository, type AdminPaymentFilterParams } from '@/db/adminPaymentRepository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionData = await getAdminSessionUser(req);
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: 'Sessão administrativa ausente ou inválida' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || undefined;
    const status = (searchParams.get('status') as any) || 'all';
    const gateway = (searchParams.get('gateway') as any) || 'all';
    const paymentMethod = (searchParams.get('payment_method') as any) || 'all';
    const billingCycle = (searchParams.get('billing_cycle') as any) || 'all';

    const repo = new AdminPaymentRepository();
    const filterParams: AdminPaymentFilterParams = {
      page,
      limit,
      search,
      status,
      gateway,
      payment_method: paymentMethod,
      billing_cycle: billingCycle,
    };

    const result = repo.getAdminPayments(filterParams);
    const stats = repo.getPaymentStats();

    return NextResponse.json({
      success: true,
      ...result,
      stats,
    });
  } catch (err: any) {
    console.error('[API Admin Pagamentos Error]:', err);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao consultar transações financeiras' },
      { status: 500 }
    );
  }
}
