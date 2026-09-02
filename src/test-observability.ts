import { ScraperOrchestrator } from './scrapers/index.js';
import { JobScraper } from './scrapers/base.js';
import { RawJob } from './types/job.js';

class FailingScraper implements JobScraper {
  name = 'Failing Test Scraper';

  async scrape(): Promise<RawJob[]> {
    throw new Error('Simulação de timeout ou falha de rede');
  }
}

async function testObservability() {
  console.log('--- Testando Observabilidade e Alertas de Falhas ---');
  const orchestrator = new ScraperOrchestrator();

  // Injetar um scraper com falha
  (orchestrator as any).scrapers.push(new FailingScraper());

  console.log('Executando scrapers...');
  await orchestrator.runAll();
  console.log('--- Teste de Observabilidade Concluído ---');
}

testObservability().catch(console.error);
