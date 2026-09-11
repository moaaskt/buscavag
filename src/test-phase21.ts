import { JobRepository } from './db/repository';

async function testPhase21() {
  console.log('--- Iniciando Teste de Validação da Fase 21 ---');
  const repo = new JobRepository();

  const now = new Date();
  const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 dias atrás

  // 1. Inserir vaga recente (agora) e vaga antiga (10 dias atrás)
  const ts = Date.now();
  const recentJob: any = {
    url: `https://test.com/job-p21-recent-${ts}`,
    title: 'Recent Job P21',
    company: 'TestCorp',
    platform: 'remotar',
    description: 'Recent job description',
    publishedAt: now,
  };
  const oldJob: any = {
    url: `https://test.com/job-p21-old-${ts}`,
    title: 'Old Job P21',
    company: 'TestCorp',
    platform: 'remotar',
    description: 'Old job description',
    publishedAt: oldDate,
  };

  const insertedRecent = repo.insert(recentJob, true, 80, 'Recent fit');
  const insertedOld = repo.insert(oldJob, true, 70, 'Old fit');

  console.log('Vagas inseridas:', insertedRecent.id, insertedOld.id);

  // 2. Testar filtro de período 24h
  const jobs24h = repo.getAllJobs({ period: '24h' });
  const hasRecentIn24h = jobs24h.some((j) => j.id === insertedRecent.id);
  const hasOldIn24h = jobs24h.some((j) => j.id === insertedOld.id);

  console.log('Filtro 24h - Recente encontrada?', hasRecentIn24h, '| Antiga encontrada?', hasOldIn24h);
  if (!hasRecentIn24h || hasOldIn24h) {
    throw new Error('Falha no filtro de período 24h!');
  }

  // 3. Testar atualização de status
  const updatedStatus = repo.updateApplicationStatus(insertedRecent.id, 'interview');
  if (!updatedStatus) {
    throw new Error('Falha ao atualizar status da vaga!');
  }
  const checkUpdated = repo.getJobById(insertedRecent.id);
  if (checkUpdated?.applicationStatus !== 'interview') {
    throw new Error('Status não foi alterado para interview!');
  }
  console.log('Status da vaga alterado para interview com sucesso!');

  // Cleanup
  repo.deleteJobs([insertedRecent.id, insertedOld.id]);
  console.log('--- Validação da Fase 21 Concluída com Sucesso! ---');
}

testPhase21().catch((err) => {
  console.error('Erro no teste da Fase 21:', err);
  process.exit(1);
});
