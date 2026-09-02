import { ScraperOrchestrator } from './scrapers/index.js';
class FailingScraper {
    name = 'Failing Test Scraper';
    async scrape() {
        throw new Error('Simulação de timeout ou falha de rede');
    }
}
async function testObservability() {
    console.log('--- Testando Observabilidade e Alertas de Falhas ---');
    const orchestrator = new ScraperOrchestrator();
    // Injetar um scraper com falha
    orchestrator.scrapers.push(new FailingScraper());
    console.log('Executando scrapers...');
    await orchestrator.runAll();
    console.log('--- Teste de Observabilidade Concluído ---');
}
testObservability().catch(console.error);
