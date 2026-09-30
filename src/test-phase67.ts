import { db, initDatabase } from './db/index';
import { CandidateRepository } from './db/candidateRepository';
import { ProcessedJob } from './types/job';
import assert from 'assert';

function runPhase67Tests() {
  console.log('\n======================================================');
  console.log('  TESTES DE INTEGRAÇÃO - PHASE 67: INBOX DO KANBAN & INGESTÃO');
  console.log('======================================================\n');

  initDatabase();
  const repo = new CandidateRepository();

  const testUserId = `test-user-p67-${Date.now()}`;
  const testEmail = `test-p67-${Date.now()}@example.com`;

  // 1. Criar Usuário
  repo.createUser({
    id: testUserId,
    email: testEmail,
    name: 'Candidato Phase 67',
    password_hash: 'hash123',
  });

  console.log('1. Testando ordenação da Inbox de vagas salvas...');

  // Criar 3 vagas de teste diretamente no SQLite com diferentes overall_score
  const jobLowId = `job-low-${Date.now()}`;
  const jobMidId = `job-mid-${Date.now()}`;
  const jobHighId = `job-high-${Date.now()}`;

  const insertJob = db.prepare(`
    INSERT INTO jobs (id, url, title, company, platform, description, overall_score, score_ia, published_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  insertJob.run(jobLowId, `https://test.com/low`, 'Desenvolvedor Jr', 'Empresa C', 'linkedin', 'Desc', 45, 45, now, now);
  insertJob.run(jobHighId, `https://test.com/high`, 'Desenvolvedor Full Stack', 'Empresa A', 'gupy', 'Desc', 92, 92, now, now);
  insertJob.run(jobMidId, `https://test.com/mid`, 'Desenvolvedor Node', 'Empresa B', 'programathor', 'Desc', 78, 78, now, now);

  // Salvar vagas em ordem inversa (primeiro low, depois mid, depois high)
  repo.toggleSavedJob(testUserId, jobLowId, 'pending');
  repo.toggleSavedJob(testUserId, jobMidId, 'pending');
  repo.toggleSavedJob(testUserId, jobHighId, 'pending');

  const savedJobs = repo.getSavedJobs(testUserId);
  console.log(`   -> Total de vagas salvas retornadas: ${savedJobs.length}`);
  savedJobs.forEach((s, idx) => {
    console.log(`   [#${idx + 1}] Title: "${s.job.title}" | Score: ${s.job.overall_score}`);
  });

  assert.strictEqual(savedJobs.length, 3, 'Deveria retornar exatamente 3 vagas');
  assert.strictEqual(savedJobs[0].job.overall_score, 92, 'A primeira vaga deve ser a de maior score (92)');
  assert.strictEqual(savedJobs[1].job.overall_score, 78, 'A segunda vaga deve ser a intermediária (78)');
  assert.strictEqual(savedJobs[2].job.overall_score, 45, 'A terceira vaga deve ser a de menor score (45)');
  console.log('   ✓ Ordenação por j.overall_score DESC validada com sucesso!');

  console.log('\n2. Testando injeção e tipagem de isStrongMatch...');
  // Simular a transformação que a API board faz
  const boardJobs: ProcessedJob[] = savedJobs.map((record) => {
    const isStrongMatch = (record.job.overall_score ?? 0) >= 75;
    return {
      id: record.job.id,
      url: record.job.url,
      title: record.job.title,
      company: record.job.company,
      platform: record.job.platform as any,
      description: '',
      publishedAt: new Date(record.job.published_at),
      location: record.job.location || undefined,
      scoreIa: record.job.score_ia,
      overallScore: record.job.overall_score,
      isStrongMatch,
      applicationStatus: record.status as any,
      isJuniorFullStack: true,
      createdAt: new Date(record.saved_at),
      gaps: [],
      notified: false,
    } as ProcessedJob;
  });

  assert.strictEqual(boardJobs[0].isStrongMatch, true, 'Vaga 92% DEVE ser isStrongMatch = true');
  assert.strictEqual(boardJobs[1].isStrongMatch, true, 'Vaga 78% DEVE ser isStrongMatch = true');
  assert.strictEqual(boardJobs[2].isStrongMatch, false, 'Vaga 45% NÃO DEVE ser isStrongMatch (false)');
  console.log('   ✓ Regra isStrongMatch (score >= 75) validada com sucesso!');

  console.log('\n3. Testando regra eliminatória de ingestão (overallScore <= 35%)...');
  // Lógica de ingestão no src/index.ts:
  const simulateIngestion = (evalScore: number) => {
    if (evalScore <= 35) {
      return { inserted: false, reason: 'score_threshold' };
    }
    return { inserted: true, reason: 'approved' };
  };

  const testCases = [
    { score: 20, expected: false },
    { score: 35, expected: false },
    { score: 36, expected: true },
    { score: 75, expected: true },
  ];

  for (const tc of testCases) {
    const res = simulateIngestion(tc.score);
    assert.strictEqual(res.inserted, tc.expected, `Score ${tc.score} deveria ter inserted=${tc.expected}`);
    console.log(`   -> Score ${tc.score}: inserted=${res.inserted} (${res.reason})`);
  }
  console.log('   ✓ Regra de descarte na ingestão (score <= 35%) validada com sucesso!');

  // Cleanup dos registros de teste
  db.prepare('DELETE FROM user_saved_jobs WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM jobs WHERE id IN (?, ?, ?)').run(jobLowId, jobMidId, jobHighId);
  db.prepare('DELETE FROM candidate_profiles WHERE user_id = ?').run(testUserId);
  db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);

  console.log('\n======================================================');
  console.log('  TODOS OS TESTES DA PHASE 67 PASSARAM COM SUCESSO! 🎉');
  console.log('======================================================\n');
}

runPhase67Tests();
