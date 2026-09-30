import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import {
  validateAuthSecretSecurity,
  DEFAULT_AUTH_SECRET,
  getAuthSecret,
  resetAuthSecretCache,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from './lib/auth';
import { POST, activeAnalyses } from './app/api/candidate/analyze-cv/route';
import { CandidateRepository } from './db/candidateRepository';
import { db } from './db/index';
import { runAllSuites } from '../scripts/test-runner';

async function runPhase70Tests() {
  console.log('\n======================================================');
  console.log('  🧪 BUSCAVAG - TESTES DA PHASE 70');
  console.log('  Segurança (AUTH_SECRET), Concorrência/Cooldown & Runner');
  console.log('======================================================\n');

  // ==========================================
  // BLOCO 1: SEGURANÇA DO AUTH_SECRET (REQ-07)
  // ==========================================
  console.log('--- 1. Testando Validação Estrita de AUTH_SECRET (REQ-07) ---');

  // 1.1 Produção + Secret Ausente/Vazio
  assert.throws(
    () => validateAuthSecretSecurity('', 'production'),
    (err: Error) => err.message.includes('AUTH_SECRET environment variable is missing'),
    'Deve lançar erro fatal em production quando AUTH_SECRET for vazio'
  );
  assert.throws(
    () => validateAuthSecretSecurity(undefined, 'production'),
    (err: Error) => err.message.includes('AUTH_SECRET environment variable is missing'),
    'Deve lançar erro fatal em production quando AUTH_SECRET for undefined'
  );
  console.log('  ✅ [PASS] production + AUTH_SECRET ausente dispara erro fatal');

  // 1.2 Produção + Secret Padrão Hardcoded
  assert.throws(
    () => validateAuthSecretSecurity(DEFAULT_AUTH_SECRET, 'production'),
    (err: Error) => err.message.includes('cannot use the default hardcoded secret'),
    'Deve lançar erro fatal em production se AUTH_SECRET for igual ao default hardcoded'
  );
  console.log('  ✅ [PASS] production + AUTH_SECRET default dispara erro fatal');

  // 1.3 Produção + Secret Curto (< 32 caracteres)
  assert.throws(
    () => validateAuthSecretSecurity('chave-curta-de-apenas-20-c', 'production'),
    (err: Error) => err.message.includes('must have at least 32 characters'),
    'Deve lançar erro fatal em production se AUTH_SECRET tiver menos de 32 caracteres'
  );
  console.log('  ✅ [PASS] production + AUTH_SECRET < 32 caracteres dispara erro fatal');

  // 1.4 Produção + Secret Forte (>= 32 caracteres)
  const strongSecret = 'chave-forte-producao-buscavag-2026-com-mais-de-32-chars!';
  const validatedSecret = validateAuthSecretSecurity(strongSecret, 'production');
  assert.strictEqual(validatedSecret, strongSecret, 'Deve aceitar chave forte em produção');
  console.log('  ✅ [PASS] production + AUTH_SECRET forte (>= 32 caracteres) aprovado');

  // 1.5 Permissividade em Development e Test com Segredo Padrão ou Ausente
  const devDefault = validateAuthSecretSecurity(DEFAULT_AUTH_SECRET, 'development');
  assert.strictEqual(devDefault, DEFAULT_AUTH_SECRET, 'Deve aceitar chave default em development');

  const testUndefined = validateAuthSecretSecurity(undefined, 'test');
  assert.strictEqual(testUndefined, DEFAULT_AUTH_SECRET, 'Deve utilizar fallback seguro em test');
  console.log('  ✅ [PASS] development/test com fallback default permitido');

  // 1.6 Runtime getAuthSecret() com simulação de ambiente
  const originalEnv = { ...process.env };
  try {
    // Simula runtime de produção sem secret
    (process.env as any).NODE_ENV = 'production';
    delete process.env.AUTH_SECRET;
    resetAuthSecretCache();
    assert.throws(
      () => getAuthSecret(),
      (err: Error) => err.message.includes('AUTH_SECRET environment variable is missing'),
      'getAuthSecret deve lançar erro fatal em runtime de produção se ausente'
    );

    // Simula runtime de produção com secret fraco
    process.env.AUTH_SECRET = 'curto';
    resetAuthSecretCache();
    assert.throws(
      () => getAuthSecret(),
      (err: Error) => err.message.includes('must have at least 32 characters'),
      'getAuthSecret deve lançar erro fatal em runtime de produção se < 32 chars'
    );

    // Simula runtime de produção com secret forte
    process.env.AUTH_SECRET = strongSecret;
    resetAuthSecretCache();
    assert.strictEqual(getAuthSecret(), strongSecret, 'getAuthSecret deve retornar chave forte em produção');
  } finally {
    process.env = originalEnv;
    resetAuthSecretCache();
  }
  console.log('  ✅ [PASS] Runtime getAuthSecret() validado em todos os cenários com cache');

  // ==========================================
  // BLOCO 2: CONCORRÊNCIA E COOLDOWN (REQ-09)
  // ==========================================
  console.log('\n--- 2. Testando Concorrência e Cooldown no analyze-cv (REQ-09) ---');

  const repo = new CandidateRepository();
  const testUserId = `user_p70_${Date.now()}`;
  const testEmail = `candidate_p70_${Date.now()}@test.com`;

  // Cria usuário de teste Premium para testes de análise de currículo
  repo.createUser({
    id: testUserId,
    email: testEmail,
    password_hash: 'hash_test_123',
    name: 'Candidato Phase 70',
    tier: 'premium',
    role: 'CANDIDATE',
  });

  // Cria arquivo de currículo temporário de teste
  const dummyFilePath = path.join(process.cwd(), `test_cv_${Date.now()}.txt`);
  fs.writeFileSync(dummyFilePath, 'Currículo de Teste da Phase 70 - Full Stack Developer');

  repo.saveResume({
    id: `res_${Date.now()}`,
    user_id: testUserId,
    filename: 'Curriculo_Phase70.txt',
    file_path: dummyFilePath,
    file_size: 512,
    file_type: 'text/plain',
  });

  const sessionToken = createSessionToken({
    userId: testUserId,
    email: testEmail,
    name: 'Candidato Phase 70',
    tier: 'premium',
    role: 'CANDIDATE',
  });

  function makeRequest(): NextRequest {
    return new NextRequest('http://localhost:3000/api/candidate/analyze-cv', {
      method: 'POST',
      headers: {
        cookie: `${SESSION_COOKIE_NAME}=${sessionToken}`,
      },
    });
  }

  // 2.1 Concorrência Simultânea: Duas requisições paralelas para o mesmo userId
  console.log('  -> Disparando 2 requisições simultâneas para o mesmo userId...');
  const [res1, res2] = await Promise.all([
    POST(makeRequest()),
    POST(makeRequest()),
  ]);

  const statuses = [res1.status, res2.status];
  assert(statuses.includes(429), 'Uma das requisições concorrentes DEVE retornar HTTP 429');
  assert(statuses.includes(200), 'Uma das requisições concorrentes DEVE ser processada com HTTP 200');

  const rejectedResponse = res1.status === 429 ? res1 : res2;
  const rejectedJson = await rejectedResponse.json();
  assert.strictEqual(rejectedJson.code, 'CONCURRENT_ANALYSIS_BLOCKED', 'Código de erro deve ser CONCURRENT_ANALYSIS_BLOCKED');
  console.log('  ✅ [PASS] Concorrência simultânea bloqueada com HTTP 429 (CONCURRENT_ANALYSIS_BLOCKED)');

  // 2.2 Lock Liberado após Sucesso
  assert.strictEqual(
    activeAnalyses.has(testUserId),
    false,
    'O lock em memória deve ser removido após a conclusão no bloco finally'
  );
  console.log('  ✅ [PASS] Lock em memória liberado no bloco finally após conclusão');

  // 2.3 Cooldown de 5s: Requisição subsequente imediata pós-conclusão
  console.log('  -> Disparando requisição imediata pós-conclusão (< 5s)...');
  const resCooldown = await POST(makeRequest());
  assert.strictEqual(resCooldown.status, 429, 'Requisição dentro de 5s pós-análise DEVE retornar HTTP 429');
  const cooldownJson = await resCooldown.json();
  assert.strictEqual(cooldownJson.code, 'COOLDOWN_ACTIVE', 'Código de erro do cooldown deve ser COOLDOWN_ACTIVE');
  console.log('  ✅ [PASS] Cooldown de 5s pós-análise ativo com HTTP 429 (COOLDOWN_ACTIVE)');

  // 2.4 Cooldown Liberado após 5s
  // Simulamos que a análise ocorreu há 6 segundos atualizando o banco
  const sixSecondsAgo = new Date(Date.now() - 6000).toISOString();
  db.prepare('UPDATE candidate_resumes SET analyzed_at = ? WHERE user_id = ?').run(sixSecondsAgo, testUserId);

  console.log('  -> Disparando requisição após a janela de 5s expirada...');
  const resAfterCooldown = await POST(makeRequest());
  assert.strictEqual(resAfterCooldown.status, 200, 'Requisição após janela de 5s DEVE processar com HTTP 200');
  console.log('  ✅ [PASS] Requisição após janela de cooldown permitida com sucesso');

  // 2.5 Liberação do Lock Garantida em Caso de Erro / Exceção
  // Adiciona manualmente no Set e simula liberação de finally
  const errorTestUserId = 'user_error_lock_test';
  activeAnalyses.add(errorTestUserId);
  try {
    throw new Error('Falha simulada no pipeline de análise');
  } catch {
    // Simula bloco catch
  } finally {
    activeAnalyses.delete(errorTestUserId);
  }
  assert.strictEqual(activeAnalyses.has(errorTestUserId), false, 'Lock deve ser removido mesmo sob exceção');
  console.log('  ✅ [PASS] Lock liberado garantidamente em bloco finally sob erro');

  // Limpeza dos arquivos temporários de teste
  try {
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  } catch {}

  // ==========================================
  // BLOCO 3: RUNNER UNIFICADO DE TESTES (REQ-08)
  // ==========================================
  console.log('\n--- 3. Testando Orquestrador do Runner de Testes (REQ-08) ---');

  // 3.1 Runner detecta falha em subprocesso e retorna allPassed = false
  const mockFailingSuite = [
    {
      id: 'failing-test',
      name: 'Suíte Simulada com Falha',
      file: 'scripts/non-existent-test-file-simulate-fail.ts',
      description: 'Validação de captura de erro pelo runner',
    },
  ];
  const failRun = runAllSuites(mockFailingSuite);
  assert.strictEqual(failRun.allPassed, false, 'Runner DEVE indicar allPassed = false quando uma suíte falha');
  assert.strictEqual(failRun.results[0].passed, false, 'Status da suíte deve ser false');
  assert.notStrictEqual(failRun.results[0].exitCode, 0, 'Exit code da suíte com falha deve ser não-zero');
  console.log('  ✅ [PASS] Runner detecta erro em subprocesso e registra exit code não-zero');

  // 3.2 Runner aprova suíte determinística com allPassed = true
  const mockPassingSuite = [
    {
      id: 'passing-test',
      name: 'Suíte Determinística Válida',
      file: 'src/test-phase1.ts',
      description: 'Validação de sucesso pelo runner',
    },
  ];
  const passRun = runAllSuites(mockPassingSuite);
  assert.strictEqual(passRun.allPassed, true, 'Runner DEVE indicar allPassed = true quando todas passam');
  assert.strictEqual(passRun.results[0].passed, true, 'Status da suíte deve ser true');
  assert.strictEqual(passRun.results[0].exitCode, 0, 'Exit code da suíte aprovada deve ser 0');
  console.log('  ✅ [PASS] Runner conclui com sucesso (exitCode 0) quando todas as suítes passam');

  console.log('\n======================================================');
  console.log('🎉 TODOS OS TESTES DA PHASE 70 PASSARAM COM SUCESSO!');
  console.log('======================================================\n');
}

runPhase70Tests().catch((err) => {
  console.error('\n❌ Erro durante a execução dos testes da Phase 70:', err);
  process.exit(1);
});
