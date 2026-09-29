import { db, initDatabase } from './index';
import { logAdminAction } from '@/lib/logger';
import crypto from 'crypto';

export type PaymentGateway = 'mercadopago' | 'stripe' | 'asaas' | 'manual';
export type PaymentStatus = 'paid' | 'pending' | 'refunded' | 'failed' | 'courtesy';
export type PaymentMethod = 'pix' | 'credit_card' | 'boleto' | 'manual';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';
export type BillingCycle = 'monthly' | 'annual';

export interface AdminPaymentEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  gateway: PaymentGateway;
  gateway_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: PaymentMethod;
  plan_tier: string;
  billing_cycle: BillingCycle;
  invoice_url: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AdminSubscriptionEntry {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  gateway: PaymentGateway;
  gateway_subscription_id: string | null;
  tier: string;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  amount: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: number;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminPaymentFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'all' | PaymentStatus;
  gateway?: 'all' | PaymentGateway;
  payment_method?: 'all' | PaymentMethod;
  billing_cycle?: 'all' | BillingCycle;
}

export interface AdminPaymentStats {
  mrr: number;
  arr: number;
  totalRevenue: number;
  averageTicket: number;
  activeSubscribers: number;
  defaultCount: number;
  totalPaymentsCount: number;
}

export interface PaginatedPaymentsResult {
  payments: AdminPaymentEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  stats?: AdminPaymentStats;
}

export interface PaymentWebhookRecord {
  id: string;
  gateway: PaymentGateway;
  event_type: string;
  payload: Record<string, any>;
  processed: number;
  created_at: string;
}

export class AdminPaymentRepository {
  constructor() {
    initDatabase();
  }

  /**
   * Consolida métricas financeiras globais em tempo real (MRR, ARR, Ticket Médio, Receita, Inadimplência).
   */
  public getPaymentStats(): AdminPaymentStats {
    // 1. Cálculo de MRR e ARR com base nas assinaturas ativas/trialing
    const subsRows = db.prepare(`
      SELECT amount, billing_cycle 
      FROM subscriptions 
      WHERE status IN ('active', 'trialing')
    `).all() as Array<{ amount: number; billing_cycle: string }>;

    let mrr = 0;
    for (const sub of subsRows) {
      if (sub.billing_cycle === 'annual') {
        mrr += Number((sub.amount / 12).toFixed(2));
      } else {
        mrr += Number(sub.amount || 0);
      }
    }
    mrr = Number(mrr.toFixed(2));
    const arr = Number((mrr * 12).toFixed(2));

    // 2. Receita Total Aprovada e contagem de pagamentos pagos
    const revenueRow = db.prepare(`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COUNT(*) as paid_count
      FROM payments 
      WHERE status = 'paid'
    `).get() as { total_revenue: number; paid_count: number };

    const totalRevenue = Number((revenueRow?.total_revenue || 0).toFixed(2));
    const paidCount = revenueRow?.paid_count || 0;
    const averageTicket = paidCount > 0 ? Number((totalRevenue / paidCount).toFixed(2)) : 0;

    // 3. Assinantes Pro Ativos
    const activeSubscribers = subsRows.length;

    // 4. Inadimplência / Falhas (transações com status failed + assinaturas past_due)
    const failedTxnCount = (db.prepare(`SELECT COUNT(*) as count FROM payments WHERE status = 'failed'`).get() as { count: number }).count || 0;
    const pastDueSubCount = (db.prepare(`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'past_due'`).get() as { count: number }).count || 0;
    const defaultCount = failedTxnCount + pastDueSubCount;

    // 5. Total de transações gravadas
    const totalPaymentsCount = (db.prepare(`SELECT COUNT(*) as count FROM payments`).get() as { count: number }).count || 0;

    return {
      mrr,
      arr,
      totalRevenue,
      averageTicket,
      activeSubscribers,
      defaultCount,
      totalPaymentsCount,
    };
  }

  /**
   * Consulta paginada de transações com busca ampla e filtros combinados.
   */
  public getAdminPayments(params: AdminPaymentFilterParams = {}): PaginatedPaymentsResult {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim().toLowerCase()}%`;
      whereClauses.push('(LOWER(users.name) LIKE ? OR LOWER(users.email) LIKE ? OR LOWER(payments.id) LIKE ? OR LOWER(COALESCE(payments.gateway_payment_id, \'\')) LIKE ?)');
      queryParams.push(term, term, term, term);
    }

    if (params.status && params.status !== 'all') {
      whereClauses.push('payments.status = ?');
      queryParams.push(params.status);
    }

    if (params.gateway && params.gateway !== 'all') {
      whereClauses.push('payments.gateway = ?');
      queryParams.push(params.gateway);
    }

    if (params.payment_method && params.payment_method !== 'all') {
      whereClauses.push('payments.payment_method = ?');
      queryParams.push(params.payment_method);
    }

    if (params.billing_cycle && params.billing_cycle !== 'all') {
      whereClauses.push('payments.billing_cycle = ?');
      queryParams.push(params.billing_cycle);
    }

    const whereSql = whereClauses.join(' AND ');

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM payments 
      JOIN users ON payments.user_id = users.id 
      WHERE ${whereSql}
    `);
    const { total } = countStmt.get(...queryParams) as { total: number };

    const dataStmt = db.prepare(`
      SELECT 
        payments.id,
        payments.user_id,
        users.name as user_name,
        users.email as user_email,
        payments.gateway,
        payments.gateway_payment_id,
        payments.amount,
        payments.currency,
        payments.status,
        payments.payment_method,
        payments.plan_tier,
        payments.billing_cycle,
        payments.invoice_url,
        payments.metadata,
        payments.created_at,
        payments.updated_at
      FROM payments
      JOIN users ON payments.user_id = users.id
      WHERE ${whereSql}
      ORDER BY payments.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const rawPayments = dataStmt.all(...queryParams, limit, offset) as any[];
    const payments: AdminPaymentEntry[] = rawPayments.map((p) => ({
      ...p,
      metadata: this.safeParseJson(p.metadata),
    }));

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      payments,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Consulta paginada de assinaturas com dados dos candidatos associados.
   */
  public getAdminSubscriptions(params: { page?: number; limit?: number; status?: string } = {}): {
    subscriptions: AdminSubscriptionEntry[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const queryParams: any[] = [];

    if (params.status && params.status !== 'all') {
      whereClauses.push('subscriptions.status = ?');
      queryParams.push(params.status);
    }

    const whereSql = whereClauses.join(' AND ');

    const countStmt = db.prepare(`
      SELECT COUNT(*) as total 
      FROM subscriptions 
      JOIN users ON subscriptions.user_id = users.id 
      WHERE ${whereSql}
    `);
    const { total } = countStmt.get(...queryParams) as { total: number };

    const dataStmt = db.prepare(`
      SELECT 
        subscriptions.id,
        subscriptions.user_id,
        users.name as user_name,
        users.email as user_email,
        subscriptions.gateway,
        subscriptions.gateway_subscription_id,
        subscriptions.tier,
        subscriptions.billing_cycle,
        subscriptions.status,
        subscriptions.amount,
        subscriptions.current_period_start,
        subscriptions.current_period_end,
        subscriptions.cancel_at_period_end,
        subscriptions.canceled_at,
        subscriptions.created_at,
        subscriptions.updated_at
      FROM subscriptions
      JOIN users ON subscriptions.user_id = users.id
      WHERE ${whereSql}
      ORDER BY subscriptions.created_at DESC
      LIMIT ? OFFSET ?
    `);

    const subscriptions = dataStmt.all(...queryParams, limit, offset) as AdminSubscriptionEntry[];
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      subscriptions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Detalhes consolidados de uma transação específica.
   */
  public getPaymentDetail(paymentId: string): AdminPaymentEntry | null {
    const row = db.prepare(`
      SELECT 
        payments.id,
        payments.user_id,
        users.name as user_name,
        users.email as user_email,
        payments.gateway,
        payments.gateway_payment_id,
        payments.amount,
        payments.currency,
        payments.status,
        payments.payment_method,
        payments.plan_tier,
        payments.billing_cycle,
        payments.invoice_url,
        payments.metadata,
        payments.created_at,
        payments.updated_at
      FROM payments
      JOIN users ON payments.user_id = users.id
      WHERE payments.id = ?
    `).get(paymentId) as any;

    if (!row) return null;

    return {
      ...row,
      metadata: this.safeParseJson(row.metadata),
    };
  }

  /**
   * Concede assinatura de cortesia com prazo determinado para um candidato.
   */
  public grantCourtesySubscription(
    userId: string,
    days: number,
    reason: string,
    adminUser?: { id?: string; email?: string; name?: string } | null
  ): { success: boolean; paymentId: string; subscriptionId: string; expiresAt: string } | null {
    const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(userId) as any;
    if (!user) return null;

    const now = new Date();
    const periodEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const nowIso = now.toISOString();
    const periodEndIso = periodEnd.toISOString();

    const paymentId = `pay_cortesia_${crypto.randomBytes(6).toString('hex')}`;
    const subId = `sub_${crypto.randomBytes(6).toString('hex')}`;

    // 1. Registra a transação de cortesia de R$ 0,00
    db.prepare(`
      INSERT INTO payments (
        id, user_id, gateway, gateway_payment_id, amount, currency,
        status, payment_method, plan_tier, billing_cycle, invoice_url, metadata,
        created_at, updated_at
      ) VALUES (?, ?, 'manual', ?, 0, 'BRL', 'courtesy', 'manual', 'premium', 'monthly', NULL, ?, ?, ?)
    `).run(
      paymentId,
      userId,
      `cortesia_${days}d`,
      JSON.stringify({ reason, grantedBy: adminUser?.email || 'admin', days }),
      nowIso,
      nowIso
    );

    // 2. Insere ou atualiza a assinatura do usuário
    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, gateway, gateway_subscription_id, tier, billing_cycle,
        status, amount, current_period_start, current_period_end, cancel_at_period_end,
        created_at, updated_at
      ) VALUES (?, ?, 'manual', ?, 'premium', 'monthly', 'active', 0, ?, ?, 0, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        gateway = 'manual',
        status = 'active',
        tier = 'premium',
        amount = 0,
        current_period_end = ?,
        updated_at = ?
    `).run(
      subId,
      userId,
      `cortesia_${days}d`,
      nowIso,
      periodEndIso,
      nowIso,
      nowIso,
      periodEndIso,
      nowIso
    );

    // 3. Atualiza o tier do usuário para premium
    db.prepare('UPDATE users SET tier = ?, updated_at = ? WHERE id = ?').run('premium', nowIso, userId);

    // 4. Auditoria
    logAdminAction(
      adminUser || null,
      `Concessão de Cortesia Pro (${days} dias) para ${user.email}`,
      { targetUserId: userId, days, reason, paymentId, expiresAt: periodEndIso }
    );

    return {
      success: true,
      paymentId,
      subscriptionId: subId,
      expiresAt: periodEndIso,
    };
  }

  /**
   * Realiza estorno/reembolso de uma transação e reverte o plano do usuário caso necessário.
   */
  public refundPayment(
    paymentId: string,
    reason: string,
    adminUser?: { id?: string; email?: string; name?: string } | null
  ): { success: boolean; previousStatus: PaymentStatus; newStatus: PaymentStatus } | null {
    const payment = db.prepare(`
      SELECT id, user_id, status, gateway, amount 
      FROM payments 
      WHERE id = ?
    `).get(paymentId) as { id: string; user_id: string; status: PaymentStatus; gateway: string; amount: number } | undefined;

    if (!payment) return null;
    if (payment.status === 'refunded') {
      return { success: true, previousStatus: 'refunded', newStatus: 'refunded' };
    }

    const previousStatus = payment.status;
    const nowIso = new Date().toISOString();

    // 1. Atualiza status do pagamento para refunded
    db.prepare(`
      UPDATE payments 
      SET status = 'refunded', updated_at = ? 
      WHERE id = ?
    `).run(nowIso, paymentId);

    // 2. Cancela a assinatura associada ao usuário
    db.prepare(`
      UPDATE subscriptions 
      SET status = 'canceled', canceled_at = ?, updated_at = ? 
      WHERE user_id = ?
    `).run(nowIso, nowIso, payment.user_id);

    // 3. Reverte plano do usuário para free
    db.prepare(`
      UPDATE users 
      SET tier = 'free', updated_at = ? 
      WHERE id = ?
    `).run(nowIso, payment.user_id);

    // 4. Auditoria
    logAdminAction(
      adminUser || null,
      `Estorno de Pagamento no valor de R$ ${payment.amount.toFixed(2)}`,
      { targetUserId: payment.user_id, paymentId, reason, previousStatus }
    );

    return {
      success: true,
      previousStatus,
      newStatus: 'refunded',
    };
  }

  /**
   * Registra payload bruto de webhook recebido de gateway para rastreamento e auditoria.
   */
  public saveWebhookEvent(
    gateway: PaymentGateway,
    eventType: string,
    payload: Record<string, any>
  ): PaymentWebhookRecord {
    const id = `wh_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO payment_webhooks (id, gateway, event_type, payload, processed, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `).run(id, gateway, eventType, JSON.stringify(payload), nowIso);

    return {
      id,
      gateway,
      event_type: eventType,
      payload,
      processed: 1,
      created_at: nowIso,
    };
  }

  /**
   * Consulta os webhooks recebidos recentemente.
   */
  public getRecentWebhooks(limit = 50): PaymentWebhookRecord[] {
    const rows = db.prepare(`
      SELECT id, gateway, event_type, payload, processed, created_at
      FROM payment_webhooks
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit) as any[];

    return rows.map((r) => ({
      ...r,
      payload: this.safeParseJson(r.payload),
    }));
  }

  private safeParseJson(val: any): Record<string, any> | null {
    if (!val) return null;
    if (typeof val === 'object') return val;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }
}
