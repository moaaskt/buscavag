/**
 * test-phase78.ts — Suíte de testes da Phase 78
 * Gestão de Vagas Expostas & Job de Expurgo Seguro no SQLite (/admin/vagas)
 *
 * Execução: npx tsx src/test-phase78.ts
 */

import { db, initDatabase } from './db/index';
import { JobRepository } from './db/repository';
import { AdminJobRepository, type AdminJobEntry } from './db/adminJobRepository';
import { PlatformSource } from './types/job';
import crypto from 'crypto';

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
  console.log('\n🗄️ [Phase 78] Testes de Esquema e Otimização do SQLite (VPS)\n');

  test('T01 — REQ-78-01: Coluna status e índice idx_jobs_status existem no SQLite', () => {
    initDatabase();
    const cols = (db.pragma('table_info(jobs)') as Array<{ name: string }>).map((c) => c.name);
    assert(cols.includes('status'), 'coluna status deve existir na tabela jobs');

    const indexes = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>
    ).map((i) => i.name);
    assert(indexes.includes('idx_jobs_status'), 'índice idx_jobs_status deve existir');
  });

  test('T02 — REQ-78-01: auto_vacuum = INCREMENTAL ativo e incremental_vacuum executável', () => {
    const autoVacuum = db.pragma('auto_vacuum', { simple: true });
    assertEqual(autoVacuum, 2, 'auto_vacuum deve ser 2 (INCREMENTAL)');

    // Testa se incremental_vacuum executa sem falhas
    let error: Error | null = null;
    try {
      db.pragma('incremental_vacuum(10)');
    } catch (e) {
      error = e as Error;
    }
    assert(error === null, 'PRAGMA incremental_vacuum deve rodar sem erros');
  });

  console.log('\n🛡️ [Phase 78] Testes de Blindagem Pública & Consultas de Candidatos\n');

  test('T03 — REQ-78-02: getAllJobs público oculta estritamente vagas com status "hidden" e "expired"', () => {
    const jobRepo = new JobRepository();
    const uniqueId = `test_vis_${Date.now()}`;

    // Insere uma vaga ativa, uma oculta e uma expirada
    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'active')
    `).run(`${uniqueId}_active`, `https://example.com/${uniqueId}_active`, `Vaga Ativa ${uniqueId}`, 'Empresa Teste', 'linkedin', 'Desc');

    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'hidden')
    `).run(`${uniqueId}_hidden`, `https://example.com/${uniqueId}_hidden`, `Vaga Oculta ${uniqueId}`, 'Empresa Teste', 'linkedin', 'Desc');

    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'expired')
    `).run(`${uniqueId}_expired`, `https://example.com/${uniqueId}_expired`, `Vaga Expirada ${uniqueId}`, 'Empresa Teste', 'linkedin', 'Desc');

    // Consulta pública
    const publicJobs = jobRepo.getAllJobs({ search: uniqueId });
    const ids = publicJobs.map((j) => j.id);

    assert(ids.includes(`${uniqueId}_active`), 'vaga ativa DEVE constar na consulta pública');
    assert(!ids.includes(`${uniqueId}_hidden`), 'vaga oculta NÃO DEVE constar na consulta pública');
    assert(!ids.includes(`${uniqueId}_expired`), 'vaga expirada NÃO DEVE constar na consulta pública');
  });

  console.log('\n💼 [Phase 78] Testes de Gestão e Operações no AdminJobRepository\n');

  test('T04 — REQ-78-03: getAdminJobs realiza busca textual, paginação e filtros combinados', () => {
    const adminRepo = new AdminJobRepository();
    const searchTarget = `BuscaAlvo_${Date.now()}`;

    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status, work_model)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'active', 'remoto')
    `).run(`id_${searchTarget}`, `https://example.com/${searchTarget}`, searchTarget, 'Target Corp', 'gupy', 'Desc');

    const result = adminRepo.getAdminJobs({ search: searchTarget, platform: 'gupy', status: 'active' });

    assert(result.total >= 1, 'deve encontrar a vaga cadastrada');
    assertEqual(result.jobs[0].title, searchTarget, 'título correto');
    assertEqual(result.jobs[0].platform, 'gupy', 'plataforma gupy');
  });

  test('T05 — REQ-78-03: toggleJobHide alterna perfeitamente entre "active" e "hidden"', () => {
    const adminRepo = new AdminJobRepository();
    const testId = `toggle_test_${Date.now()}`;

    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'active')
    `).run(testId, `https://example.com/${testId}`, 'Toggle Job', 'Corp', 'indeed', 'Desc');

    // 1º Toggle: active -> hidden
    const res1 = adminRepo.toggleJobHide(testId);
    assert(Boolean(res1), 'toggle deve retornar resultado');
    assertEqual(res1!.previousStatus, 'active', 'deve vir de active');
    assertEqual(res1!.newStatus, 'hidden', 'deve ir para hidden');

    // 2º Toggle: hidden -> active
    const res2 = adminRepo.toggleJobHide(testId);
    assertEqual(res2!.previousStatus, 'hidden', 'deve vir de hidden');
    assertEqual(res2!.newStatus, 'active', 'deve retornar para active');
  });

  test('T06 — REQ-78-03: updateJob retifica dados in-place (título, empresa, stack, modelo)', () => {
    const adminRepo = new AdminJobRepository();
    const testId = `edit_test_${Date.now()}`;

    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'active')
    `).run(testId, `https://example.com/${testId}`, 'Título Original', 'Empresa Original', 'indeed', 'Desc');

    const updated = adminRepo.updateJob(testId, {
      title: 'Engenheiro Full Stack Pleno (Corrigido)',
      company: 'TechCorp Brasil',
      location: 'São Paulo - SP',
      work_model: 'hibrido',
      required_seniority: 'Pleno',
      tech_stack: 'React, Node.js, TypeScript',
    });

    assert(updated, 'updateJob deve retornar true');

    const check = db.prepare('SELECT title, company, work_model, required_seniority FROM jobs WHERE id = ?').get(testId) as any;
    assertEqual(check.title, 'Engenheiro Full Stack Pleno (Corrigido)', 'título retificado');
    assertEqual(check.company, 'TechCorp Brasil', 'empresa retificada');
    assertEqual(check.work_model, 'hibrido', 'modelo de trabalho retificado');
    assertEqual(check.required_seniority, 'Pleno', 'senioridade retificada');
  });

  test('T07 — REQ-78-03: deleteJobPermanent remove vaga definitiva e limpa relações órfãs', () => {
    const adminRepo = new AdminJobRepository();
    const testId = `delete_perm_${Date.now()}`;

    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'active')
    `).run(testId, `https://example.com/${testId}`, 'Job to delete', 'Corp', 'indeed', 'Desc');

    const deleted = adminRepo.deleteJobPermanent(testId);
    assert(deleted, 'deleteJobPermanent deve retornar true');

    const check = db.prepare('SELECT 1 FROM jobs WHERE id = ?').get(testId);
    assert(!check, 'vaga não deve mais existir no banco de dados');
  });

  console.log('\n🧹 [Phase 78] Testes do Motor de Expurgo Seguro & Proteção de Candidatos\n');

  test('T08 — REQ-78-04: Vagas salvas em user_saved_jobs NUNCA são deletadas pelo expurgo', () => {
    const adminRepo = new AdminJobRepository();
    const protectedJobId = `prot_saved_${Date.now()}`;
    const testUserId = `test_usr_${Date.now()}`;

    // Insere vaga expirada há mais de 30 dias
    db.prepare(`
      INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-35 days'), datetime('now', '-35 days'), 'expired')
    `).run(protectedJobId, `https://example.com/${protectedJobId}`, 'Vaga Salva Expirada', 'Corp', 'indeed', 'Desc');

    // Cria usuário de teste e salva a vaga
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
      VALUES (?, ?, 'hash', 'Test Candidate', datetime('now'), datetime('now'))
    `).run(testUserId, `${testUserId}@example.com`);

    db.prepare(`
      INSERT INTO user_saved_jobs (user_id, job_id, status, created_at)
      VALUES (?, ?, 'applied', datetime('now'))
    `).run(testUserId, protectedJobId);

    // Executa expurgo seguro com retenção de 21 dias
    adminRepo.executeBatchPurge(21);

    // Verifica que a vaga ainda existe intacta
    const check = db.prepare('SELECT 1 FROM jobs WHERE id = ?').get(protectedJobId);
    assert(Boolean(check), 'vaga favoritada/aplicada deve continuar existindo após o expurgo');
  });

  test('T09 — REQ-78-04: executeBatchPurge deleta apenas expiradas não-salvas além da retenção em lotes', () => {
    const adminRepo = new AdminJobRepository();
    const batchPrefix = `batch_purge_${Date.now()}`;

    // Insere 3 vagas com mais de 30 dias sem vínculo de candidato
    for (let i = 1; i <= 3; i++) {
      db.prepare(`
        INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-35 days'), datetime('now', '-35 days'), 'expired')
      `).run(`${batchPrefix}_${i}`, `https://example.com/${batchPrefix}_${i}`, `Vaga Expirada ${i}`, 'Corp', 'indeed', 'Desc');
    }

    const result = adminRepo.executeBatchPurge(21, 2);

    assert(result.totalDeleted >= 3, 'deve deletar pelo menos as 3 vagas criadas');
    assert(result.batches >= 2, 'deve ter executado em múltiplos lotes devido ao batchSize=2');
    assert(result.reclaimedDisk === true, 'deve ter acionado o incremental_vacuum');

    const check = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE id LIKE ?').get(`${batchPrefix}%`) as { count: number };
    assertEqual(check.count, 0, 'nenhuma das vagas deve existir após o expurgo');
  });

  test('T10 — REQ-78-04 / REQ-78-05: previewPurge retorna contagem exata sem deletar nenhuma vaga', () => {
    const adminRepo = new AdminJobRepository();
    const previewPrefix = `preview_test_${Date.now()}`;

    for (let i = 1; i <= 2; i++) {
      db.prepare(`
        INSERT INTO jobs (id, url, title, company, platform, description, published_at, created_at, status)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-40 days'), datetime('now', '-40 days'), 'expired')
      `).run(`${previewPrefix}_${i}`, `https://example.com/${previewPrefix}_${i}`, `Vaga Preview ${i}`, 'Corp', 'indeed', 'Desc');
    }

    const preview = adminRepo.previewPurge(21);
    assert(preview.eligibleCount >= 2, 'preview deve acusar pelo menos as 2 vagas inseridas');

    // Confirma que nenhuma foi deletada
    const countCheck = db.prepare('SELECT COUNT(*) as count FROM jobs WHERE id LIKE ?').get(`${previewPrefix}%`) as { count: number };
    assertEqual(countCheck.count, 2, 'as vagas devem continuar no banco após o preview');

    // Limpeza final
    db.prepare('DELETE FROM jobs WHERE id LIKE ?').run(`${previewPrefix}%`);
  });

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

  if (failed > 0) {
    console.error(`\n❌ Falha na suíte da Phase 78: ${failed} teste(s) reprovado(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ Todos os 10 testes da Phase 78 aprovados com 100% de sucesso!');
  }
}

runTests().catch((err) => {
  console.error('Erro fatal ao rodar testes da Phase 78:', err);
  process.exit(1);
});
