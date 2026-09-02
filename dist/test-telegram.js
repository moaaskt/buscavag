import { TelegramScraper } from './scrapers/telegram.js';
import { TelegramNotifier } from './services/telegramNotifier.js';
import { PlatformSource } from './types/job.js';
async function testTelegramIntegration() {
    console.log('--- Testando Coletor de Canais do Telegram ---');
    const scraper = new TelegramScraper();
    const jobs = await scraper.scrape();
    console.log(`Telegram Scraper coletou ${jobs.length} vagas.`);
    console.log('\n--- Testando Serviço de Notificação do Telegram ---');
    const notifier = new TelegramNotifier();
    const mockJob = {
        id: 'mock-123',
        title: 'Desenvolvedor Full Stack Jr (Node.js & React)',
        company: 'Startup Inovadora',
        platform: PlatformSource.TELEGRAM,
        url: 'https://t.me/s/vagasdev',
        description: 'Vaga para atuar com desenvolvimento de APIs em Node e interfaces React.',
        publishedAt: new Date(),
        location: '100% Remoto',
        isJuniorFullStack: true,
        scoreIa: 98,
        aiReasoning: 'Vaga perfeitamente alinhada com os requisitos de Jr.',
        notified: false,
        createdAt: new Date(),
    };
    const sent = await notifier.sendNotification(mockJob);
    console.log(`Envio de notificação executado com sucesso: ${sent}`);
    console.log('--- Teste da Fase 3 Concluído ---');
}
testTelegramIntegration().catch(console.error);
