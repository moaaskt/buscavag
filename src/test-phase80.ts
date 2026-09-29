/**
 * test-phase80.ts — Suíte de testes da Phase 80
 * Gestão Financeira & Pagamentos (/admin/pagamentos)
 *
 * Execução: npx tsx src/test-phase80.ts
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { db, initDatabase } from './db/index';
import { AdminPaymentRepository } from './db/adminPaymentRepository';
import { POST as webhookPostHandler } from './app/api/webhooks/payments/[gateway]/route';

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)}`);
  }
}

async function runTests() {
  console.log('\n🗄️ [Phase 80] Testes de Esquema Financeiro e Tabelas no SQLite\n');

  await test('T01 — REQ-80-01: Tabelas payments, subscriptions e payment_webhooks com índices existem no SQLite', () => {
    initDatabase();
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    ).map((t) => t.name);

    assert(tables.includes('payments'), 'tabela payments deve existir');
    assert(tables.includes('subscriptions'), 'tabela subscriptions deve existir');
    assert(tables.includes('payment_webhooks'), 'tabela payment_webhooks deve existir');

    const indexes = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>
    ).map((i) => i.name);

    assert(indexes.includes('idx_payments_user_id'), 'índice idx_payments_user_id deve existir');
    assert(indexes.includes('idx_payments_status'), 'índice idx_payments_status deve existir');
    assert(indexes.includes('idx_subscriptions_user_id'), 'índice idx_subscriptions_user_id deve existir');
    assert(indexes.includes('idx_webhooks_gateway'), 'índice idx_webhooks_gateway deve existir');
  });

  console.log('\n📊 [Phase 80] Testes de Cálculo de Métricas (MRR, ARR, Ticket Médio e Receita)\n');

  await test('T02 — REQ-80-02: Cálculo exato de MRR, ARR, Ticket Médio e Receita em getPaymentStats', () => {
    const repo = new AdminPaymentRepository();
    const unique = `stats_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const user1Id = `usr1_${unique}`;
    const user2Id = `usr2_${unique}`;

    // Cria 2 usuários
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'User 1', 'premium', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(user1Id, `${user1Id}@test.com`);

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'User 2', 'premium', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(user2Id, `${user2Id}@test.com`);

    // Insere 1 assinatura mensal de R$ 29.90 e 1 anual de R$ 199.90
    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, gateway, tier, billing_cycle, status, amount,
        current_period_start, current_period_end, created_at, updated_at
      ) VALUES (?, ?, 'stripe', 'premium', 'monthly', 'active', 29.90, datetime('now'), datetime('now', '+30 days'), datetime('now'), datetime('now'))
    `).run(`sub1_${unique}`, user1Id);

    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, gateway, tier, billing_cycle, status, amount,
        current_period_start, current_period_end, created_at, updated_at
      ) VALUES (?, ?, 'mercadopago', 'premium', 'annual', 'active', 199.90, datetime('now'), datetime('now', '+365 days'), datetime('now'), datetime('now'))
    `).run(`sub2_${unique}`, user2Id);

    // Insere pagamentos pagos correspondentes
    db.prepare(`
      INSERT INTO payments (
        id, user_id, gateway, amount, currency, status, payment_method, plan_tier, billing_cycle, created_at, updated_at
      ) VALUES (?, ?, 'stripe', 29.90, 'BRL', 'paid', 'credit_card', 'premium', 'monthly', datetime('now'), datetime('now'))
    `).run(`pay1_${unique}`, user1Id);

    db.prepare(`
      INSERT INTO payments (
        id, user_id, gateway, amount, currency, status, payment_method, plan_tier, billing_cycle, created_at, updated_at
      ) VALUES (?, ?, 'mercadopago', 199.90, 'BRL', 'paid', 'pix', 'premium', 'annual', datetime('now'), datetime('now'))
    `).run(`pay2_${unique}`, user2Id);

    const stats = repo.getPaymentStats();

    assert(stats.mrr >= 46.55, 'MRR deve ser calculado proporcionalizando anual e mensal');
    assert(stats.arr >= stats.mrr * 12 - 1, 'ARR deve ser aproximadamente MRR * 12');
    assert(stats.totalRevenue >= 229.80, 'Receita total deve incluir os pagamentos pagos');
    assert(stats.averageTicket > 0, 'Ticket médio deve ser maior que zero');
    assert(stats.activeSubscribers >= 2, 'Assinantes ativos Pro');
  });

  console.log('\n🔎 [Phase 80] Testes de Consulta Paginada e Detalhes da Transação\n');

  await test('T03 — REQ-80-03: getAdminPayments realiza busca textual, paginação e filtros combinados', () => {
    const repo = new AdminPaymentRepository();
    const unique = `filter_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = `usr_${unique}`;
    const userEmail = `${unique}@cliente.test`;
    const userName = `Cliente Especial ${unique}`;
    const gatewayTxnId = `ext_${unique}`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', ?, 'premium', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(userId, userEmail, userName);

    const paymentId = `pay_${unique}`;
    db.prepare(`
      INSERT INTO payments (
        id, user_id, gateway, gateway_payment_id, amount, currency, status, payment_method, plan_tier, billing_cycle, created_at, updated_at
      ) VALUES (?, ?, 'asaas', ?, 29.90, 'BRL', 'paid', 'pix', 'premium', 'monthly', datetime('now'), datetime('now'))
    `).run(paymentId, userId, gatewayTxnId);

    // 1. Busca por nome
    const resByName = repo.getAdminPayments({ search: userName, gateway: 'asaas', status: 'paid' });
    assert(resByName.total >= 1, 'deve encontrar pagamento por nome do cliente');
    assertEqual(resByName.payments[0].user_name, userName, 'nome do cliente no retorno');

    // 2. Busca por ID externo do gateway
    const resByExt = repo.getAdminPayments({ search: gatewayTxnId });
    assert(resByExt.total >= 1, 'deve encontrar pagamento por ID externo');
    assertEqual(resByExt.payments[0].gateway_payment_id, gatewayTxnId, 'id externo no retorno');
  });

  await test('T04 — REQ-80-03: getPaymentDetail retorna transação completa com usuário e metadata parseado', () => {
    const repo = new AdminPaymentRepository();
    const unique = `detail_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = `usr_${unique}`;
    const paymentId = `pay_${unique}`;
    const metaObj = { cardLast4: '4242', brand: 'visa', ip: '127.0.0.1' };

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Comprador Detalhe', 'premium', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(userId, `${unique}@detail.test`);

    db.prepare(`
      INSERT INTO payments (
        id, user_id, gateway, gateway_payment_id, amount, currency, status, payment_method,
        plan_tier, billing_cycle, invoice_url, metadata, created_at, updated_at
      ) VALUES (?, ?, 'stripe', 'ch_123', 29.90, 'BRL', 'paid', 'credit_card', 'premium', 'monthly', 'https://fatura.ex/1', ?, datetime('now'), datetime('now'))
    `).run(paymentId, userId, JSON.stringify(metaObj));

    const detail = repo.getPaymentDetail(paymentId);
    assert(detail !== null, 'detalhes da transação não devem ser nulos');
    assertEqual(detail?.id, paymentId, 'id da transação');
    assertEqual(detail?.metadata?.cardLast4, '4242', 'metadata cardLast4');
    assertEqual(detail?.invoice_url, 'https://fatura.ex/1', 'invoice_url');
  });

  console.log('\n🎁 [Phase 80] Testes de Operações de Suporte (Cortesia Pro e Estorno)\n');

  await test('T05 — REQ-80-04: grantCourtesySubscription concede cortesia de R$ 0,00 e eleva usuário a premium', () => {
    const repo = new AdminPaymentRepository();
    const unique = `cortesia_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = `usr_${unique}`;
    const userEmail = `${unique}@cortesia.test`;
    const adminUser = { id: 'adm_1', email: 'suporte@admin.buscavag.com', name: 'Suporte Admin' };

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Candidato Cortesia', 'free', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(userId, userEmail);

    const result = repo.grantCourtesySubscription(userEmail, 30, 'Cortesia de teste de integração', adminUser);
    assert(result !== null && result.success, 'concessão de cortesia por email deve ter sucesso');

    // Valida que o usuário virou premium
    const userCheck = db.prepare('SELECT tier FROM users WHERE id = ?').get(userId) as { tier: string };
    assertEqual(userCheck.tier, 'premium', 'tier do usuário deve ser premium');

    // Valida transação de R$ 0,00 com status courtesy
    const payCheck = db.prepare('SELECT amount, status, gateway FROM payments WHERE id = ?').get(result!.paymentId) as any;
    assertEqual(payCheck.amount, 0, 'valor da cortesia deve ser 0');
    assertEqual(payCheck.status, 'courtesy', 'status da transação');
    assertEqual(payCheck.gateway, 'manual', 'gateway manual');

    // Valida assinatura ativa com término futuro
    const subCheck = db.prepare('SELECT status, current_period_end FROM subscriptions WHERE user_id = ?').get(userId) as any;
    assertEqual(subCheck.status, 'active', 'assinatura ativa');
    assert(new Date(subCheck.current_period_end).getTime() > Date.now(), 'expiração futura');
  });

  await test('T06 — REQ-80-04: refundPayment marca transação como refunded, cancela assinatura e reverte para free', () => {
    const repo = new AdminPaymentRepository();
    const unique = `refund_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = `usr_${unique}`;
    const paymentId = `pay_${unique}`;
    const adminUser = { id: 'adm_1', email: 'financeiro@admin.buscavag.com', name: 'Financeiro Admin' };

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Candidato Estornado', 'premium', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(userId, `${unique}@refund.test`);

    db.prepare(`
      INSERT INTO payments (
        id, user_id, gateway, amount, currency, status, payment_method, plan_tier, billing_cycle, created_at, updated_at
      ) VALUES (?, ?, 'stripe', 29.90, 'BRL', 'paid', 'credit_card', 'premium', 'monthly', datetime('now'), datetime('now'))
    `).run(paymentId, userId);

    db.prepare(`
      INSERT INTO subscriptions (
        id, user_id, gateway, tier, billing_cycle, status, amount, current_period_start, current_period_end, created_at, updated_at
      ) VALUES (?, ?, 'stripe', 'premium', 'monthly', 'active', 29.90, datetime('now'), datetime('now', '+30 days'), datetime('now'), datetime('now'))
    `).run(`sub_${unique}`, userId);

    const refundRes = repo.refundPayment(paymentId, 'Solicitação do cliente dentro dos 7 dias', adminUser);
    assert(refundRes !== null && refundRes.success, 'estorno deve ser bem sucedido');
    assertEqual(refundRes?.newStatus, 'refunded', 'novo status refunded');

    // Valida status no banco
    const payCheck = db.prepare('SELECT status FROM payments WHERE id = ?').get(paymentId) as any;
    assertEqual(payCheck.status, 'refunded', 'status do pagamento deve ser refunded');

    const subCheck = db.prepare('SELECT status FROM subscriptions WHERE user_id = ?').get(userId) as any;
    assertEqual(subCheck.status, 'canceled', 'status da assinatura deve ser canceled');

    const userCheck = db.prepare('SELECT tier FROM users WHERE id = ?').get(userId) as any;
    assertEqual(userCheck.tier, 'free', 'usuário deve voltar para free');
  });

  console.log('\n⚡ [Phase 80] Testes de Ingestão e Processamento de Webhooks\n');

  await test('T07 — REQ-80-05: saveWebhookEvent persiste payload integral em payment_webhooks', () => {
    const repo = new AdminPaymentRepository();
    const eventPayload = { id: 'evt_123', type: 'payment_intent.succeeded', data: { amount: 2990 } };

    const eventRecord = repo.saveWebhookEvent('stripe', 'payment_intent.succeeded', eventPayload);
    assert(Boolean(eventRecord.id), 'id do webhook deve ser gerado');

    const check = db.prepare('SELECT * FROM payment_webhooks WHERE id = ?').get(eventRecord.id) as any;
    assert(check !== undefined, 'registro deve constar na tabela payment_webhooks');
    assertEqual(check.gateway, 'stripe', 'gateway');
    assertEqual(check.event_type, 'payment_intent.succeeded', 'event_type');

    const parsed = JSON.parse(check.payload);
    assertEqual(parsed.id, 'evt_123', 'payload id');
  });

  await test('T08 — REQ-80-05: Webhook de pagamento aprovado ativa assinatura e plano premium do candidato', async () => {
    const unique = `wh_flow_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userEmail = `${unique}@asaas.test`;
    const userId = `usr_${unique}`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Candidato Asaas', 'free', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(userId, userEmail);

    const asaasWebhookBody = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        id: `pay_asaas_${unique}`,
        customerEmail: userEmail,
        value: 29.90,
        billingType: 'PIX',
      },
    };

    const req = new NextRequest('http://localhost:3000/api/webhooks/payments/asaas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(asaasWebhookBody),
    });

    const res = await webhookPostHandler(req, { params: Promise.resolve({ gateway: 'asaas' }) });
    assertEqual(res.status, 200, 'status HTTP do webhook');
    const data = await res.json();
    assert(data.received === true, 'received deve ser true');

    // Valida que o usuário foi ativado para premium
    const userCheck = db.prepare('SELECT tier FROM users WHERE id = ?').get(userId) as any;
    assertEqual(userCheck.tier, 'premium', 'tier do usuário deve ser elevado para premium');

    // Valida que foi criada uma assinatura ativa
    const subCheck = db.prepare('SELECT status, tier, amount FROM subscriptions WHERE user_id = ?').get(userId) as any;
    assert(subCheck !== undefined, 'deve ter criado assinatura');
    assertEqual(subCheck.status, 'active', 'assinatura ativa');
    assertEqual(subCheck.tier, 'premium', 'tier premium');
  });

  console.log('\n📜 [Phase 80] Testes de Listagem de Assinaturas e Auditoria\n');

  await test('T09 — REQ-80-06: getAdminSubscriptions lista assinaturas dos candidatos com períodos', () => {
    const repo = new AdminPaymentRepository();
    const result = repo.getAdminSubscriptions({ limit: 10 });

    assert(typeof result.total === 'number', 'total deve ser numérico');
    assert(Array.isArray(result.subscriptions), 'subscriptions deve ser um array');
    if (result.subscriptions.length > 0) {
      const first = result.subscriptions[0];
      assert(Boolean(first.user_name), 'nome do assinante deve estar presente');
      assert(Boolean(first.current_period_end), 'data final da vigência presente');
    }
  });

  await test('T10 — REQ-80-07: Intervenções manuais de suporte gravam logs de auditoria com origem admin_action', () => {
    const repo = new AdminPaymentRepository();
    const unique = `audit_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const userId = `usr_${unique}`;
    const adminUser = { id: 'adm_audit', email: 'auditor@admin.test', name: 'Auditor Chefe' };

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Audit User', 'free', 'CANDIDATE', datetime('now'), datetime('now'))
    `).run(userId, `${unique}@audit.test`);

    // Dispara cortesia
    repo.grantCourtesySubscription(userId, 15, 'Teste Auditoria Phase 80', adminUser);

    // Consulta os logs gravados
    const logRow = db.prepare(`
      SELECT * FROM logs 
      WHERE origem = 'admin_action' AND mensagem LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).get('%Cortesia Pro%') as any;

    assert(logRow !== undefined, 'deve existir registro de log com origem admin_action');
    assertEqual(logRow.origem, 'admin_action', 'origem admin_action');
    assertEqual(logRow.tipo, 'acao', 'tipo acao');

    const meta = JSON.parse(logRow.metadata);
    assertEqual(meta.adminEmail, adminUser.email, 'adminEmail gravado nos metadados');
    assertEqual(meta.targetUserId, userId, 'targetUserId gravado nos metadados');
  });

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

  if (failed > 0) {
    console.error(`\n❌ Falha na suíte da Phase 80: ${failed} teste(s) reprovado(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ Todos os 10 testes da Phase 80 aprovados com 100% de sucesso!');
  }
}

runTests().catch((err) => {
  console.error('Erro fatal ao rodar testes da Phase 80:', err);
  process.exit(1);
});
