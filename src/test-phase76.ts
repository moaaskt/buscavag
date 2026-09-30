/**
 * test-phase76.ts — Suíte de testes da Phase 76
 * Autenticação Admin Isolada & Sessão Dedicada com TOTP Configurável e Fundação Velzon
 *
 * Execução: npx tsx src/test-phase76.ts
 */

import crypto from 'crypto';
import { db, initDatabase } from './db/index';
import { AdminRepository } from './db/adminRepository';
import {
  createAdminSessionToken,
  verifyAdminSessionToken,
  hashTokenForStorage,
  getAdminAuthSecret,
  DEFAULT_ADMIN_AUTH_SECRET,
  ADMIN_SESSION_TTL_SECONDS,
} from './lib/admin-auth';
import { decodeAdminSessionTokenEdge } from './lib/admin-edge-auth';
import {
  generateTotpSecret,
  generateTotpUri,
  generateQrCodeDataUrl,
  verifyTotpToken,
} from './lib/totp';
import { createSessionToken } from './lib/auth';
import { generateSync } from 'otplib';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          console.log(`  ✅ ${name}`);
          passed++;
        })
        .catch((err: any) => {
          console.error(`  ❌ ${name}`);
          console.error(`     ${err.message}`);
          failed++;
        });
    } else {
      console.log(`  ✅ ${name}`);
      passed++;
    }
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
  console.log('\n🛡️ [Phase 76] Testes de Banco de Dados e Isolamento de Esquema\n');

  test('T01 — REQ-76-01: Tabelas admin_users, admin_sessions e admin_settings existem no SQLite', () => {
    initDatabase();
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    ).map((t) => t.name);

    assert(tables.includes('admin_users'), 'tabela admin_users deve existir');
    assert(tables.includes('admin_sessions'), 'tabela admin_sessions deve existir');
    assert(tables.includes('admin_settings'), 'tabela admin_settings deve existir');
  });

  console.log('\n🔑 [Phase 76] Testes de Criptografia, Token e Isolamento de Sessão\n');

  test('T02 — REQ-76-02: Emissão e verificação de token admin_session válido', () => {
    const payload = {
      adminId: 'admin-uuid-123',
      email: 'admin@buscavag.com.br',
      name: 'Super Admin',
      role: 'ADMIN' as const,
      sessionId: 'session-uuid-456',
    };

    const { token, tokenHash, expiresAt } = createAdminSessionToken(payload);
    assert(typeof token === 'string' && token.split('.').length === 3, 'token deve ter formato JWT');
    assert(tokenHash.length === 64, 'tokenHash deve ser SHA-256 (64 hex chars)');
    assert(new Date(expiresAt).getTime() > Date.now(), 'expiresAt deve ser futuro');

    const verified = verifyAdminSessionToken(token);
    assert(verified !== null, 'token deve ser verificado com sucesso');
    assertEqual(verified?.adminId, payload.adminId, 'adminId');
    assertEqual(verified?.email, payload.email, 'email');
    assertEqual(verified?.role, 'ADMIN', 'role');
    assertEqual(verified?.sessionId, payload.sessionId, 'sessionId');
  });

  test('T03 — REQ-76-02: Token de candidato (assinado com AUTH_SECRET) é rejeitado por admin-auth', () => {
    // Cria token de candidato normal usando lib/auth
    const candidateToken = createSessionToken({
      userId: 'cand-123',
      email: 'candidato@email.com',
      name: 'João Candidato',
      tier: 'free',
      role: 'CANDIDATE',
    });

    const verifiedByAdmin = verifyAdminSessionToken(candidateToken);
    assertEqual(verifiedByAdmin, null, 'token de candidato não deve ser aceito como admin');
  });

  test('T04 — REQ-76-02: Token admin adulterado ou com assinatura corrompida é rejeitado', () => {
    const { token } = createAdminSessionToken({
      adminId: 'admin-123',
      email: 'admin@buscavag.com.br',
      name: 'Admin',
      role: 'ADMIN',
      sessionId: 'sess-123',
    });

    const parts = token.split('.');
    const corruptedToken = `${parts[0]}.${parts[1]}.assinatura_falsa_123`;
    const verified = verifyAdminSessionToken(corruptedToken);
    assertEqual(verified, null, 'token adulterado deve retornar null');
  });

  console.log('\n🗄️ [Phase 76] Testes de Repositório e Revogação Remota (admin_sessions)\n');

  test('T05 — REQ-76-01 / REQ-76-02: Criação de sessão e revogação remota bem-sucedida', () => {
    const repo = new AdminRepository();
    const testAdminId = `test-admin-${Date.now()}`;
    const testEmail = `test-${Date.now()}@buscavag.com.br`;

    repo.createAdminUser({
      id: testAdminId,
      email: testEmail,
      password_hash: 'hash-fake',
      name: 'Admin Teste',
    });

    const sessionId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(`token-${Date.now()}`).digest('hex');
    const expiresAt = new Date(Date.now() + 7200 * 1000).toISOString();

    const session = repo.createSession({
      id: sessionId,
      admin_user_id: testAdminId,
      token_hash: tokenHash,
      ip_address: '192.168.1.100',
      user_agent: 'TestAgent/1.0',
      expires_at: expiresAt,
    });

    assertEqual(session.id, sessionId, 'sessionId inserido');
    assertEqual(session.admin_user_id, testAdminId, 'admin_user_id');

    // Consulta por hash
    const found = repo.getSessionByTokenHash(tokenHash);
    assert(found !== null, 'sessão deve ser encontrada pelo hash do token');
    assertEqual(found?.ip_address, '192.168.1.100', 'ip_address preservado');

    // Revogação
    repo.revokeSession(sessionId);
    const afterRevoke = repo.getSessionByTokenHash(tokenHash);
    assertEqual(afterRevoke, null, 'sessão revogada não deve ser encontrada');

    // Limpeza de isolamento
    db.prepare('DELETE FROM admin_users WHERE id = ?').run(testAdminId);
  });

  console.log('\n📱 [Phase 76] Testes de 2FA / TOTP (RFC 6238 & QR Code)\n');

  test('T06 — REQ-76-03: Geração de segredo Base32 e validação RFC 6238 de token com otplib', () => {
    const secret = generateTotpSecret();
    assert(typeof secret === 'string' && secret.length >= 16, 'segredo deve ter formato Base32 válido');

    // Gera token numérico sincronizado
    const token = generateSync({ secret });
    assert(typeof token === 'string' && token.length === 6, 'token deve ter 6 dígitos');

    const isValid = verifyTotpToken(token, secret);
    assert(isValid, 'token gerado deve ser aceito como válido');

    const isInvalid = verifyTotpToken('000000', secret);
    assert(!isInvalid || token === '000000', 'token aleatório incorreto deve ser rejeitado');
  });

  await test('T07 — REQ-76-03: Geração de URI otpauth e QR Code em Data URL', async () => {
    const secret = generateTotpSecret();
    const uri = generateTotpUri('admin@buscavag.com.br', secret, 'BuscaVag Enterprise');
    assert(uri.startsWith('otpauth://totp/'), 'URI deve iniciar com otpauth://totp/');
    assert(uri.includes('admin%40buscavag.com.br'), 'URI deve conter e-mail codificado');
    assert(uri.includes(secret), 'URI deve conter o segredo');

    const qrCodeDataUrl = await generateQrCodeDataUrl(uri);
    assert(qrCodeDataUrl.startsWith('data:image/png;base64,'), 'QR Code deve ser Data URL base64');
  });

  console.log('\n🌐 [Phase 76] Testes de Edge Decoder & Sliding Expiration\n');

  test('T08 — REQ-76-04: Decodificador Edge (decodeAdminSessionTokenEdge) valida token válido', () => {
    const payload = {
      adminId: 'edge-admin-1',
      email: 'edge@buscavag.com.br',
      name: 'Edge Admin',
      role: 'ADMIN' as const,
      sessionId: 'edge-sess-1',
    };

    const { token } = createAdminSessionToken(payload);
    const decoded = decodeAdminSessionTokenEdge(token);

    assert(decoded !== null, 'edge decoder deve decodificar token válido');
    assertEqual(decoded?.role, 'ADMIN', 'role ADMIN');
    assertEqual(decoded?.email, 'edge@buscavag.com.br', 'email decodificado');
  });

  test('T09 — REQ-76-02: Atualização de tempo de sessão (sliding expiration touch)', () => {
    const repo = new AdminRepository();
    const testAdmin = repo.ensureSeedAdmin();
    const sessionId = crypto.randomUUID();
    const tokenHash = crypto.createHash('sha256').update(`token-touch-${Date.now()}`).digest('hex');
    const oldExpiresAt = new Date(Date.now() + 1800 * 1000).toISOString();

    repo.createSession({
      id: sessionId,
      admin_user_id: testAdmin.id,
      token_hash: tokenHash,
      expires_at: oldExpiresAt,
    });

    const newExpiresAt = new Date(Date.now() + 7200 * 1000).toISOString();
    repo.touchSession(sessionId, newExpiresAt);

    const updated = repo.getSessionByTokenHash(tokenHash);
    assertEqual(updated?.expires_at, newExpiresAt, 'expires_at deve ter sido atualizado');
    repo.revokeSession(sessionId);
  });

  test('T10 — REQ-76-01: Seed automático garante admin padrão em ambiente de desenvolvimento', () => {
    const repo = new AdminRepository();
    const seedAdmin = repo.ensureSeedAdmin();

    assert(seedAdmin !== null, 'seedAdmin deve existir');
    assert(seedAdmin.email.length > 0, 'seedAdmin deve ter e-mail');
    assert(seedAdmin.password_hash.includes(':'), 'seedAdmin deve ter hash scrypt com salt');

    // Verifica configuração de TOTP padrão
    const setting = repo.getSetting('totp_enabled');
    assert(setting !== null, 'setting totp_enabled deve estar configurado');
  });

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

  if (failed > 0) {
    console.error(`\n❌ Falha na suíte da Phase 76: ${failed} teste(s) reprovado(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ Todos os 10 testes da Phase 76 aprovados com 100% de sucesso!');
  }
}

runTests().catch((err) => {
  console.error('Erro fatal ao rodar testes:', err);
  process.exit(1);
});
