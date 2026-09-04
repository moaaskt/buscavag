import { ScraperOrchestrator } from './scrapers/index.js';

async function testPhase11() {
  console.log('=== TESTE DE ORQUESTRAÇÃO PARALELA (FASE 11) ===\n');

  // Testando com concorrência = 5 e timeout = 35s
  const orchestrator = new ScraperOrchestrator(undefined, {
    concurrency: 5,
    timeoutPerScraperMs: 35000,
  });

  const startTime = Date.now();
  const jobs = await orchestrator.runAll();
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`\n========================================`);
  console.log(`⏱️ Tempo total de execução paralela: ${totalDuration}s`);
  console.log(`📦 Total de vagas consolidadas: ${jobs.length}`);
  console.log(`========================================\n`);

  const counts: Record<string, number> = {};
  for (const job of jobs) {
    counts[job.platform] = (counts[job.platform] || 0) + 1;
  }
  console.table(counts);
}

testPhase11().catch(console.error);
