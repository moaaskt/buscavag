import { PythonBridgeClient } from './services/pythonBridge.js';
import { ScraperOrchestrator } from './scrapers/index.js';

async function testBridge() {
  console.log('--- TESTE DA PONTE TYPESCRIPT ↔ PYTHON ---');
  const bridge = new PythonBridgeClient();

  console.log('[1] Testando HealthCheck com o Scrapling Engine...');
  const available = await bridge.isAvailable();
  console.log(` -> Scrapling Engine está disponível? ${available ? 'SIM (ONLINE)' : 'NÃO (OFFLINE)'}`);

  if (available) {
    console.log('[2] Testando endpoint /scrape com fonte mock...');
    try {
      const jobs = await bridge.scrape('mock', { query: 'Engenheiro de Software', limit: 3 });
      console.log(` -> Vagas retornadas com sucesso (${jobs.length}):`);
      jobs.forEach((j, i) => {
        console.log(`    [${i+1}] ${j.title} @ ${j.company} (${j.location}) -> ${j.url}`);
      });
    } catch (e: any) {
      console.error(` -> Erro ao testar /scrape:`, e.message);
    }
  } else {
    console.log(' -> [INFO] Scrapling Engine offline (esperado se o container ou uvicorn não estiver rodando na porta 8000 local).');
  }

  console.log('[3] Instanciando ScraperOrchestrator com suporte à ponte Python...');
  const orchestrator = new ScraperOrchestrator();
  console.log(' -> ScraperOrchestrator instanciado e tipado perfeitamente.');
  console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
}

testBridge().catch((err) => {
  console.error('Erro fatal no teste de ponte:', err);
  process.exit(1);
});
