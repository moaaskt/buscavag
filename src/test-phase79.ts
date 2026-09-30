/**
 * test-phase79.ts — Suíte de testes da Phase 79
 * Gestão de Usuários, Permissões & Suporte (/admin/usuarios)
 *
 * Execução: npx tsx src/test-phase79.ts
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { db, initDatabase } from './db/index';
import { AdminUserRepository } from './db/adminUserRepository';
import { CandidateRepository } from './db/candidateRepository';
import { POST as loginPostHandler } from './app/api/auth/login/route';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE_NAME,
} from './lib/auth';
import { logAdminAction } from './lib/logger';

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
  console.log('\n🗄️ [Phase 79] Testes de Esquema e Ciclo de Vida do Usuário no SQLite\n');

  await test('T01 — REQ-79-01: Colunas status, force_password_change e índices existem no SQLite', () => {
    initDatabase();
    const cols = (db.pragma('table_info(users)') as Array<{ name: string }>).map((c) => c.name);
    assert(cols.includes('status'), 'coluna status deve existir na tabela users');
    assert(cols.includes('force_password_change'), 'coluna force_password_change deve existir na tabela users');

    const indexes = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>
    ).map((i) => i.name);
    assert(indexes.includes('idx_users_status'), 'índice idx_users_status deve existir');
    assert(indexes.includes('idx_users_tier'), 'índice idx_users_tier deve existir');
  });

  console.log('\n🔒 [Phase 79] Testes de Bloqueio de Acesso e Autenticação de Candidatos\n');

  await test('T02 — REQ-79-02: Endpoint /api/auth/login bloqueia estritamente contas suspensas com HTTP 403', async () => {
    const uniqueEmail = `suspended_user_${Date.now()}@example.com`;
    const password = 'MinhaSenhaSegura123';
    const pwdHash = hashPassword(password);
    const userId = `usr_susp_${Date.now()}`;

    // Insere usuário suspenso
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, status, force_password_change, created_at, updated_at)
      VALUES (?, ?, ?, 'Usuário Suspenso', 'free', 'CANDIDATE', 'suspended', 0, datetime('now'), datetime('now'))
    `).run(userId, uniqueEmail, pwdHash);

    // 1. Tenta login com a conta suspensa
    const suspendedReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password }),
    });

    const resSuspended = await loginPostHandler(suspendedReq);
    assertEqual(resSuspended.status, 403, 'status HTTP para conta suspensa');

    const dataSuspended = await resSuspended.json();
    assert(dataSuspended.success === false, 'success deve ser false');
    assert(
      dataSuspended.error && dataSuspended.error.includes('suspensa'),
      'mensagem deve informar que a conta foi suspensa'
    );

    // 2. Reativa o usuário e valida que o login passa com 200
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run('active', userId);

    const activeReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password }),
    });

    const resActive = await loginPostHandler(activeReq);
    assertEqual(resActive.status, 200, 'status HTTP para conta reativada');
    const dataActive = await resActive.json();
    assert(dataActive.success === true, 'login deve ser bem-sucedido');
    assert(Boolean(resActive.cookies.get(SESSION_COOKIE_NAME)), 'cookie buscavag_session deve ser emitido');
  });

  console.log('\n📊 [Phase 79] Testes do AdminUserRepository (Busca, Filtros, Stats e Perfil)\n');

  await test('T03 — REQ-79-03: getAdminUsers realiza busca textual, paginação e filtros combinados', () => {
    const adminRepo = new AdminUserRepository();
    const searchTarget = `AlvoBusca_${Date.now()}`;
    const emailTarget = `${searchTarget.toLowerCase()}@buscavag.test`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, status, created_at, updated_at)
      VALUES (?, ?, 'hash', ?, 'premium', 'CANDIDATE', 'active', datetime('now'), datetime('now'))
    `).run(`id_${searchTarget}`, emailTarget, searchTarget);

    const result = adminRepo.getAdminUsers({
      search: searchTarget,
      tier: 'premium',
      status: 'active',
      role: 'CANDIDATE',
    });

    assert(result.total >= 1, 'deve encontrar pelo menos o usuário inserido');
    assertEqual(result.users[0].name, searchTarget, 'nome do usuário retornado');
    assertEqual(result.users[0].tier, 'premium', 'plano premium');
    assertEqual(result.users[0].status, 'active', 'status ativo');
    assertEqual(result.users[0].role, 'CANDIDATE', 'papel CANDIDATE');
  });

  await test('T04 — REQ-79-03: getAdminUserStats consolida contadores analíticos em tempo real', () => {
    const adminRepo = new AdminUserRepository();
    const stats = adminRepo.getAdminUserStats();

    assert(typeof stats.totalUsers === 'number' && stats.totalUsers >= 0, 'totalUsers deve ser numérico');
    assert(typeof stats.proUsers === 'number' && stats.proUsers >= 0, 'proUsers deve ser numérico');
    assert(typeof stats.freeUsers === 'number' && stats.freeUsers >= 0, 'freeUsers deve ser numérico');
    assert(typeof stats.suspendedUsers === 'number' && stats.suspendedUsers >= 0, 'suspendedUsers deve ser numérico');
    assert(stats.proUsers + stats.freeUsers === stats.totalUsers, 'soma de pro + free deve equivaler a totalUsers');
  });

  await test('T05 — REQ-79-03: getUserDetail consolida dados de users, candidate_profiles, resumes e kanban', () => {
    const adminRepo = new AdminUserRepository();
    const testUserId = `detail_usr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const testEmail = `${testUserId}@example.com`;

    // 1. Cria usuário
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, status, onboarding_completed, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Candidato Detalhado', 'premium', 'CANDIDATE', 'active', 1, datetime('now'), datetime('now'))
    `).run(testUserId, testEmail);

    // 2. Cria perfil de candidato
    db.prepare(`
      INSERT INTO candidate_profiles (user_id, target_role, seniority, expected_salary, preferred_work_models, skills, primary_stack, secondary_stack, bio, city, state, updated_at)
      VALUES (?, 'Engenheiro Full Stack', 'Senior', '15000', '["remoto","hibrido"]', '["TypeScript","Node.js","React"]', '["TypeScript"]', '["Python"]', 'Bio de teste', 'São Paulo', 'SP', datetime('now'))
    `).run(testUserId);

    // 3. Cria currículo com análise de IA
    const resumeId = `res_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const aiAnalysis = {
      detected_role: 'Engenheiro Full Stack',
      detected_seniority: 'Senior',
      hard_skills: ['TypeScript', 'Node.js'],
      soft_skills: ['Comunicação'],
      primary_stack: ['TypeScript'],
      secondary_stack: ['Python'],
      work_model: 'remoto',
      expected_salary: '15000',
      summary: 'Profissional qualificado',
      strengths: ['Experiência sólida'],
      improvement_tips: [],
    };
    db.prepare(`
      INSERT INTO candidate_resumes (id, user_id, filename, file_path, file_size, file_type, ai_analysis, analyzed_at, uploaded_at)
      VALUES (?, ?, 'curriculo.pdf', '/uploads/curriculo.pdf', 102400, 'application/pdf', ?, datetime('now'), datetime('now'))
    `).run(resumeId, testUserId, JSON.stringify(aiAnalysis));

    // 4. Cria vaga salva e candidatura no kanban
    const jobId = `job_kanban_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, 'Vaga Teste Kanban', 'TechCorp', 'linkedin', 'Desc', datetime('now'), datetime('now'), 'active')
    `).run(jobId, `https://ex.com/job/${jobId}`);

    db.prepare(`
      INSERT INTO user_saved_jobs (user_id, job_id, status, created_at)
      VALUES (?, ?, 'applied', datetime('now'))
    `).run(testUserId, jobId);

    // Consulta os detalhes consolidados
    const detail = adminRepo.getUserDetail(testUserId);
    assert(detail !== null, 'detalhes do usuário não devem ser nulos');
    assertEqual(detail?.user.id, testUserId, 'ID do usuário correto');
    assertEqual(detail?.profile?.target_role, 'Engenheiro Full Stack', 'cargo desejado no perfil');
    assertEqual(detail?.profile?.city, 'São Paulo', 'cidade no perfil');
    assert(detail?.resumes.length === 1, 'deve conter 1 currículo');
    assertEqual(detail?.resumes[0].ai_analysis?.detected_role, 'Engenheiro Full Stack', 'cargo detectado pela IA no currículo');
    assertEqual(detail?.savedJobsCount, 1, 'savedJobsCount');
    assertEqual(detail?.appliedJobsCount, 1, 'appliedJobsCount');
  });

  console.log('\n⚡ [Phase 79] Testes de Operações de Suporte (Plano, Suspensão e Reset de Senha)\n');

  await test('T06 — REQ-79-03: updateUserTier atualiza plano SaaS (free ↔ premium)', () => {
    const adminRepo = new AdminUserRepository();
    const testId = `tier_test_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const testEmail = `${testId}@test.com`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, status, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Tier Test', 'free', 'CANDIDATE', 'active', datetime('now'), datetime('now'))
    `).run(testId, testEmail);

    // Upgrade para premium
    const upSuccess = adminRepo.updateUserTier(testId, 'premium');
    assert(upSuccess, 'updateUserTier para premium deve retornar true');
    const check1 = db.prepare('SELECT tier FROM users WHERE id = ?').get(testId) as { tier: string };
    assertEqual(check1.tier, 'premium', 'deve estar premium');

    // Downgrade para free
    const downSuccess = adminRepo.updateUserTier(testId, 'free');
    assert(downSuccess, 'updateUserTier para free deve retornar true');
    const check2 = db.prepare('SELECT tier FROM users WHERE id = ?').get(testId) as { tier: string };
    assertEqual(check2.tier, 'free', 'deve estar free');
  });

  await test('T07 — REQ-79-03: toggleUserSuspension alterna status entre "active" e "suspended"', () => {
    const adminRepo = new AdminUserRepository();
    const testId = `susp_toggle_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const testEmail = `${testId}@test.com`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, status, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Toggle Susp', 'free', 'CANDIDATE', 'active', datetime('now'), datetime('now'))
    `).run(testId, testEmail);

    // 1. Ativo -> Suspenso
    const res1 = adminRepo.toggleUserSuspension(testId);
    assert(res1 !== null, 'toggle não deve retornar null');
    assertEqual(res1!.previousStatus, 'active', 'previousStatus');
    assertEqual(res1!.newStatus, 'suspended', 'newStatus');

    // 2. Suspenso -> Ativo
    const res2 = adminRepo.toggleUserSuspension(testId);
    assertEqual(res2!.previousStatus, 'suspended', 'previousStatus na reversão');
    assertEqual(res2!.newStatus, 'active', 'newStatus na reversão');
  });

  await test('T08 — REQ-79-03: resetUserPassword gera credencial temporária BV-XXXXXX e marca force_password_change', () => {
    const adminRepo = new AdminUserRepository();
    const testId = `reset_pwd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const testEmail = `${testId}@test.com`;

    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, status, force_password_change, created_at, updated_at)
      VALUES (?, ?, 'old_hash', 'Reset Pwd', 'free', 'CANDIDATE', 'active', 0, datetime('now'), datetime('now'))
    `).run(testId, testEmail);

    const result = adminRepo.resetUserPassword(testId);
    assert(result !== null && result.success, 'resetUserPassword deve ter sucesso');
    assert(result!.tempPassword.startsWith('BV-'), 'senha temporária deve começar com BV-');
    assert(result!.tempPassword.length >= 8, 'senha temporária deve ter tamanho mínimo adequado');

    const check = db.prepare('SELECT password_hash, force_password_change FROM users WHERE id = ?').get(testId) as {
      password_hash: string;
      force_password_change: number;
    };

    assertEqual(check.force_password_change, 1, 'force_password_change deve estar ativado (1)');
    assert(
      verifyPassword(result!.tempPassword, check.password_hash),
      'senha temporária deve bater com o hash scrypt gravado no banco'
    );
  });

  console.log('\n🕵️ [Phase 79] Testes de Impersonate Auditável e Logs Operacionais\n');

  await test('T09 — REQ-79-04: createSessionToken gera payload com impersonatedBy e é validado', () => {
    const candidateData = {
      userId: 'usr_target_123',
      email: 'candidato@buscavag.test',
      name: 'Candidato Suporte',
      tier: 'premium' as const,
      role: 'CANDIDATE' as const,
      impersonatedBy: {
        adminId: 'adm_operador_456',
        adminEmail: 'operador@admin.buscavag.com',
      },
    };

    const token = createSessionToken(candidateData);
    assert(typeof token === 'string' && token.split('.').length === 3, 'token deve ser JWT válido');

    const decoded = verifySessionToken(token);
    assert(decoded !== null, 'token deve ser decodificado');
    assertEqual(decoded?.userId, candidateData.userId, 'userId no token');
    assertEqual(decoded?.email, candidateData.email, 'email no token');
    assert(Boolean(decoded?.impersonatedBy), 'impersonatedBy deve estar presente');
    assertEqual(decoded?.impersonatedBy?.adminId, 'adm_operador_456', 'adminId do suporte');
    assertEqual(decoded?.impersonatedBy?.adminEmail, 'operador@admin.buscavag.com', 'adminEmail do suporte');
  });

  await test('T10 — REQ-79-05: logAdminAction registra auditoria com origem "admin_action" e metadados no SQLite', () => {
    const adminUser = {
      id: 'admin_audit_789',
      email: 'auditor@admin.buscavag.com',
      name: 'Auditor do Sistema',
    };
    const actionDesc = `Ação Operacional de Teste ${Date.now()}`;
    const targetUserId = `target_usr_${Date.now()}`;

    logAdminAction(adminUser, actionDesc, {
      targetUserId,
      motivo: 'Teste Automatizado Phase 79',
    });

    const logRecord = db.prepare(`
      SELECT * FROM logs 
      WHERE mensagem = ? AND origem = 'admin_action'
      ORDER BY created_at DESC LIMIT 1
    `).get(actionDesc) as any;

    assert(logRecord !== undefined, 'registro de log deve ser encontrado na tabela logs');
    assertEqual(logRecord.tipo, 'acao', 'tipo deve ser "acao"');
    assertEqual(logRecord.nivel, 'info', 'nivel deve ser "info"');
    assertEqual(logRecord.origem, 'admin_action', 'origem deve ser "admin_action"');

    const meta = JSON.parse(logRecord.metadata);
    assertEqual(meta.adminEmail, adminUser.email, 'adminEmail gravado nos metadados');
    assertEqual(meta.adminName, adminUser.name, 'adminName gravado nos metadados');
    assertEqual(meta.targetUserId, targetUserId, 'targetUserId gravado nos metadados');
  });

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

  if (failed > 0) {
    console.error(`\n❌ Falha na suíte da Phase 79: ${failed} teste(s) reprovado(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ Todos os 10 testes da Phase 79 aprovados com 100% de sucesso!');
  }
}

runTests().catch((err) => {
  console.error('Erro fatal ao rodar testes da Phase 79:', err);
  process.exit(1);
});
