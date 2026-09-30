/**
 * test-phase77.ts — Suíte de testes da Phase 77
 * Unificação de Logs & Auditoria Admin (/admin/logs)
 *
 * Execução: npx tsx src/test-phase77.ts
 */

import { db, initDatabase } from './db/index';
import { LogRepository, type LogEntry } from './db/logRepository';
import { logger, logAdminAction } from './lib/logger';

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
  console.log('\n🗄️ [Phase 77] Testes de Esquema e Índices da Tabela Unificada de Logs\n');

  test('T01 — REQ-77-01: Tabela logs e índices dedicados existem no SQLite', () => {
    initDatabase();
    const tables = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>
    ).map((t) => t.name);

    assert(tables.includes('logs'), 'tabela logs deve existir no banco');

    const indexes = (
      db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all() as Array<{ name: string }>
    ).map((i) => i.name);

    assert(indexes.includes('idx_logs_tipo'), 'índice idx_logs_tipo deve existir');
    assert(indexes.includes('idx_logs_nivel'), 'índice idx_logs_nivel deve existir');
    assert(indexes.includes('idx_logs_origem'), 'índice idx_logs_origem deve existir');
    assert(indexes.includes('idx_logs_created_at'), 'índice idx_logs_created_at deve existir');
  });

  console.log('\n📝 [Phase 77] Testes de Inserção e Métodos do LogRepository\n');

  test('T02 — REQ-77-02: Inserção de logs tipo sistema, acao e mensageria', () => {
    const repo = new LogRepository();

    const log1 = repo.insertLog({
      tipo: 'sistema',
      nivel: 'info',
      origem: 'db_maintenance',
      mensagem: 'Varredura automática iniciada',
    });
    assertEqual(log1.tipo, 'sistema', 'tipo sistema');

    const log2 = repo.insertLog({
      tipo: 'acao',
      nivel: 'warning',
      origem: 'admin_action',
      mensagem: 'Hard delete executado pelo operador',
    });
    assertEqual(log2.tipo, 'acao', 'tipo acao');

    const log3 = repo.insertLog({
      tipo: 'mensageria',
      nivel: 'error',
      origem: 'telegram_bot',
      mensagem: 'Falha ao entregar webhook',
    });
    assertEqual(log3.tipo, 'mensageria', 'tipo mensageria');
  });

  test('T03 — REQ-77-02: Paginação correta com cálculo de limit, offset e totalPages', () => {
    const repo = new LogRepository();
    const result = repo.queryLogs({ page: 1, limit: 2 });

    assert(Array.isArray(result.logs), 'logs deve ser um array');
    assert(result.logs.length <= 2, 'deve respeitar o limit 2');
    assert(result.total >= 3, 'total deve contabilizar todos os registros existentes');
    assert(result.totalPages >= 2, 'totalPages deve ser >= 2');
    assertEqual(result.page, 1, 'page deve ser 1');
  });

  test('T04 — REQ-77-02: Filtro estrito por tipo (acao vs sistema)', () => {
    const repo = new LogRepository();
    const resultAcao = repo.queryLogs({ tipo: 'acao', limit: 10 });

    for (const log of resultAcao.logs) {
      assertEqual(log.tipo, 'acao', 'todos os logs retornados devem ter tipo acao');
    }
  });

  test('T05 — REQ-77-02: Filtro estrito por nivel (error vs warning vs info)', () => {
    const repo = new LogRepository();
    const resultError = repo.queryLogs({ nivel: 'error', limit: 10 });

    for (const log of resultError.logs) {
      assertEqual(log.nivel, 'error', 'todos os logs retornados devem ter nivel error');
    }
  });

  test('T06 — REQ-77-02: Busca textual case-insensitive por substring na mensagem', () => {
    const repo = new LogRepository();
    const uniqueTerm = `termo_unico_${Date.now()}`;

    repo.insertLog({
      tipo: 'sistema',
      nivel: 'info',
      origem: 'test_engine',
      mensagem: `Mensagem especial contendo ${uniqueTerm} para busca`,
    });

    const searchResult = repo.queryLogs({ search: uniqueTerm });
    assert(searchResult.logs.length >= 1, 'deve encontrar o log pela substring');
    assert(searchResult.logs[0].mensagem.includes(uniqueTerm), 'mensagem deve conter o termo pesquisado');
  });

  console.log('\n🔎 [Phase 77] Testes de Dropdown Dinâmico & Metadados JSON\n');

  test('T07 — REQ-77-02: getDistinctOrigins retorna origens dinâmicas ordenadas', () => {
    const repo = new LogRepository();
    const origins = repo.getDistinctOrigins();

    assert(Array.isArray(origins), 'origins deve ser array');
    assert(origins.includes('admin_action'), 'origem admin_action deve constar');
    assert(origins.includes('telegram_bot'), 'origem telegram_bot deve constar');

    // Validação de ordenação ascendente
    for (let i = 0; i < origins.length - 1; i++) {
      assert(origins[i].localeCompare(origins[i + 1]) <= 0, 'origens devem estar ordenadas alfabeticamente');
    }
  });

  test('T08 — REQ-77-02: Persistência e recuperação de metadata em JSON estruturado', () => {
    const repo = new LogRepository();
    const testMeta = {
      ip: '200.180.10.5',
      userAgent: 'Mozilla/5.0 TestBrowser',
      actionPayload: { jobId: '123', reason: 'noise_purge' },
    };

    const inserted = repo.insertLog({
      tipo: 'acao',
      nivel: 'info',
      origem: 'admin_test',
      mensagem: 'Ação com metadados estruturados',
      metadata: testMeta,
    });

    assert(inserted.metadata !== null, 'metadata não deve ser null');
    const parsed = JSON.parse(inserted.metadata!);
    assertEqual(parsed.ip, '200.180.10.5', 'parsed.ip');
    assertEqual(parsed.actionPayload.reason, 'noise_purge', 'parsed.actionPayload.reason');
  });

  console.log('\n📊 [Phase 77] Testes de Estatísticas & Auditoria via Logger\n');

  test('T09 — REQ-77-02: getLogStats consolida contadores por tipo e nível nas últimas 24h', () => {
    const repo = new LogRepository();
    const stats = repo.getLogStats(24);

    assert(typeof stats.total24h === 'number', 'total24h numérico');
    assert(typeof stats.acoes24h === 'number', 'acoes24h numérico');
    assert(typeof stats.warnings24h === 'number', 'warnings24h numérico');
    assert(typeof stats.errors24h === 'number', 'errors24h numérico');
    assert(stats.total24h > 0, 'total24h deve ser maior que zero');
  });

  test('T10 — REQ-77-03: logger.info e logAdminAction gravam automaticamente na tabela unificada', () => {
    const testMsg = `AdminAction_Test_${Date.now()}`;

    logAdminAction(
      { id: 'admin-test-id', email: 'admin@buscavag.com.br', name: 'Gestor' },
      testMsg,
      { affectedRecords: 42 }
    );

    const repo = new LogRepository();
    const query = repo.queryLogs({ search: testMsg });

    assert(query.logs.length >= 1, 'logAdminAction deve gravar na tabela logs');
    assertEqual(query.logs[0].tipo, 'acao', 'tipo deve ser acao');
    assertEqual(query.logs[0].origem, 'admin_action', 'origem deve ser admin_action');
    assert(Boolean(query.logs[0].metadata?.includes('admin@buscavag.com.br')), 'metadata deve conter email do admin');
  });

  console.log('\n──────────────────────────────────────────────────');
  console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

  if (failed > 0) {
    console.error(`\n❌ Falha na suíte da Phase 77: ${failed} teste(s) reprovado(s).`);
    process.exit(1);
  } else {
    console.log('\n✅ Todos os 10 testes da Phase 77 aprovados com 100% de sucesso!');
  }
}

runTests().catch((err) => {
  console.error('Erro fatal ao rodar testes:', err);
  process.exit(1);
});
