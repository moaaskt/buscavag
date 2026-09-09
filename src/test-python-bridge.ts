import { PythonBridgeClient } from './services/pythonBridge.js';
import { ScraperOrchestrator } from './scrapers/index.js';
import { CathoScraper } from './scrapers/catho.js';
import { RemotarScraper } from './scrapers/remotar.js';
import { GoogleJobsScraper } from './scrapers/googleJobs.js';

async function testBridge() {
  console.log('--- TESTE DA PONTE TYPESCRIPT ↔ PYTHON (FASE 34) ---');
  const bridge = new PythonBridgeClient();

  console.log('[1] Testando HealthCheck com o Scrapling Engine...');
  const available = await bridge.isAvailable();
  console.log(` -> Scrapling Engine está disponível? ${available ? 'SIM (ONLINE)' : 'NÃO (OFFLINE)'}`);

  if (available) {
    console.log('\n[2] Testando Scrapers Python através das classes TypeScript:');
    
    // Teste Catho
    try {
      console.log(' -> Executando CathoScraper.scrape()...');
      const cathoScraper = new CathoScraper(bridge);
      const cathoJobs = await cathoScraper.scrape();
      console.log(`    ✅ Catho retornou ${cathoJobs.length} vagas. Exemplo: "${cathoJobs[0]?.title}" (${cathoJobs[0]?.company})`);
    } catch (e: any) {
      console.error(`    ❌ Erro no CathoScraper:`, e.message);
    }

    // Teste Remotar
    try {
      console.log(' -> Executando RemotarScraper.scrape()...');
      const remotarScraper = new RemotarScraper(bridge);
      const remotarJobs = await remotarScraper.scrape();
      console.log(`    ✅ Remotar retornou ${remotarJobs.length} vagas. Exemplo: "${remotarJobs[0]?.title}" (${remotarJobs[0]?.company})`);
    } catch (e: any) {
      console.error(`    ❌ Erro no RemotarScraper:`, e.message);
    }

    // Teste Google Jobs
    try {
      console.log(' -> Executando GoogleJobsScraper.scrape()...');
      const googleScraper = new GoogleJobsScraper(bridge);
      const googleJobs = await googleScraper.scrape();
      console.log(`    ✅ Google Jobs retornou ${googleJobs.length} vagas. Exemplo: "${googleJobs[0]?.title}" (${googleJobs[0]?.company})`);
    } catch (e: any) {
      console.error(`    ❌ Erro no GoogleJobsScraper:`, e.message);
    }
  } else {
    console.log(' -> [INFO] Scrapling Engine offline na porta 8000.');
  }

  console.log('\n[3] Instanciando ScraperOrchestrator...');
  const orchestrator = new ScraperOrchestrator();
  console.log(' -> ScraperOrchestrator instanciado com sucesso.');
  console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
}

testBridge().catch((err) => {
  console.error('Erro fatal no teste de ponte:', err);
  process.exit(1);
});
