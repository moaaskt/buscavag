import dotenv from 'dotenv';
import { ProgramathorScraper } from './scrapers/programathor.js';
import { RemotarScraper } from './scrapers/remotar.js';
import { CathoScraper } from './scrapers/catho.js';
import { GlassdoorScraper } from './scrapers/glassdoor.js';

dotenv.config();

async function testPhase6() {
  console.log(`\n======================================================`);
  console.log(`  BUSCAVAG - TESTE FASE 6: NOVOS SCRAPERS`);
  console.log(`  Executado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`======================================================\n`);

  const scrapers = [
    new ProgramathorScraper(),
    new RemotarScraper(),
    new CathoScraper(),
    new GlassdoorScraper(),
  ];

  let totalJobs = 0;
  let passedCount = 0;
  let failedCount = 0;

  for (const scraper of scrapers) {
    console.log(`\n--- Testando: ${scraper.name} ---`);
    const startTime = Date.now();

    try {
      const jobs = await scraper.scrape();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      totalJobs += jobs.length;

      console.log(`✅ ${scraper.name}: ${jobs.length} vaga(s) encontrada(s) em ${elapsed}s`);

      if (jobs.length > 0) {
        // Mostrar preview das primeiras 3 vagas
        const preview = jobs.slice(0, 3);
        for (const job of preview) {
          console.log(`   📋 "${job.title}" | ${job.company} | ${job.location || 'N/A'} | ${job.platform}`);
          console.log(`      🔗 ${job.url}`);
        }
        if (jobs.length > 3) {
          console.log(`   ... e mais ${jobs.length - 3} vaga(s)`);
        }
      }

      passedCount++;
    } catch (err) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.error(`❌ ${scraper.name}: FALHA em ${elapsed}s - ${(err as Error).message}`);
      failedCount++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`  RESULTADO DOS TESTES`);
  console.log(`------------------------------------------------------`);
  console.log(`  Scrapers testados: ${scrapers.length}`);
  console.log(`  Passou: ${passedCount}  |  Falhou: ${failedCount}`);
  console.log(`  Total de vagas coletadas: ${totalJobs}`);
  console.log(`======================================================\n`);

  if (failedCount > 0) {
    console.warn(`⚠️ Alguns scrapers falharam. Isso pode ser normal se a plataforma bloqueou o acesso ou está offline.`);
  }
}

testPhase6().catch((err) => {
  console.error('[ERRO CRÍTICO NO TESTE]:', err);
  process.exit(1);
});
