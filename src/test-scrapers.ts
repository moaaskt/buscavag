import { ScraperOrchestrator } from './scrapers/index.js';
import { JobRepository } from './db/repository.js';

async function testAllScrapers() {
  console.log('--- Iniciando Teste da Fase 2: Web Scrapers ---');
  const orchestrator = new ScraperOrchestrator();
  const repo = new JobRepository();

  const jobs = await orchestrator.runAll();

  console.log(`\n--- Total de Vagas Coletadas: ${jobs.length} ---`);

  let newJobsCount = 0;
  for (const job of jobs) {
    if (!repo.exists(job.url, job.company, job.title)) {
      newJobsCount++;
      console.log(`[NOVA VAGA] [${job.platform.toUpperCase()}] ${job.title} | ${job.company} | ${job.location || 'Local N/D'} | Publicado: ${job.publishedAt.toLocaleDateString()}`);
    } else {
      console.log(`[DUPLICADA] ${job.title} - ${job.company}`);
    }
  }

  console.log(`\nResumo: ${jobs.length} vagas coletadas, ${newJobsCount} novas vagas para o banco.`);
  console.log('--- Teste da Fase 2 Concluído com Sucesso ---');
}

testAllScrapers().catch(console.error);
