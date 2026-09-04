import { JobRepository } from './db/repository';

async function testPhase19() {
  console.log('--- Iniciando Teste de Validação da Fase 19 ---');
  const repo = new JobRepository();

  // 1. Inserir 2 vagas dummy para teste de exclusão em lote
  const now = new Date();
  const job1 = {
    url: 'https://test.com/job-p19-1',
    title: 'Test Job P19 1',
    company: 'TestCorp',
    platform: 'remotar',
    description: 'Test description 1',
    publishedAt: now,
  };
  const job2 = {
    url: 'https://test.com/job-p19-2',
    title: 'Test Job P19 2',
    company: 'TestCorp',
    platform: 'remotar',
    description: 'Test description 2',
    publishedAt: now,
  };

  const inserted1 = repo.insert(job1, true, 85, 'Good fit');
  const inserted2 = repo.insert(job2, true, 90, 'Great fit');

  console.log('Vagas inseridas para teste:', inserted1.id, inserted2.id);

  // 2. Testar busca e existência
  const found1 = repo.getJobById(inserted1.id);
  const found2 = repo.getJobById(inserted2.id);
  if (!found1 || !found2) {
    throw new Error('Falha ao encontrar vagas inseridas!');
  }
  console.log('Vagas encontradas no DB com sucesso.');

  // 3. Testar deleteJobs com lista de IDs
  const deleted = repo.deleteJobs([inserted1.id, inserted2.id]);
  console.log('Resultado do deleteJobs:', deleted);
  if (!deleted) {
    throw new Error('deleteJobs retornou false');
  }

  const check1 = repo.getJobById(inserted1.id);
  const check2 = repo.getJobById(inserted2.id);
  if (check1 || check2) {
    throw new Error('Vagas ainda existem após deleteJobs!');
  }
  console.log('Vagas excluídas com sucesso em lote!');

  console.log('--- Validação da Fase 19 Concluída com Sucesso! ---');
}

testPhase19().catch((err) => {
  console.error('Erro no teste da Fase 19:', err);
  process.exit(1);
});
