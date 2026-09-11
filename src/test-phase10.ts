import { ScraperOrchestrator } from './scrapers/index.js';

async function testPhase10() {
  console.log('--- TESTANDO SCRAPERS DA FASE 10 ---');
  const orchestrator = new ScraperOrchestrator();
  const startTime = Date.now();
  
  const jobs = await orchestrator.runAll();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n========================================`);
  console.log(`Finalizado em ${duration}s.`);
  console.log(`Total de vagas coletadas: ${jobs.length}`);
  console.log(`Distribuição por plataforma:`);
  
  const counts: Record<string, number> = {};
  for (const job of jobs) {
    counts[job.platform] = (counts[job.platform] || 0) + 1;
  }
  console.table(counts);
  console.log(`========================================\n`);

  if (jobs.length > 0) {
    console.log('Amostra de vaga coletada:');
    console.log(JSON.stringify(jobs[0], null, 2));
  }
}

testPhase10().catch(console.error);
