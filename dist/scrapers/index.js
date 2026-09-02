import { GupyScraper } from './gupy.js';
import { LinkedInScraper } from './linkedin.js';
import { IndeedScraper } from './indeed.js';
import { GoogleJobsScraper } from './googleJobs.js';
import { TelegramScraper } from './telegram.js';
import { TelegramNotifier } from '../services/telegramNotifier.js';
export class ScraperOrchestrator {
    scrapers;
    notifier;
    constructor(notifier) {
        this.scrapers = [
            new GupyScraper(),
            new LinkedInScraper(),
            new IndeedScraper(),
            new GoogleJobsScraper(),
            new TelegramScraper(),
        ];
        this.notifier = notifier || new TelegramNotifier();
    }
    async runAll() {
        console.log(`[ScraperOrchestrator] Iniciando execução de ${this.scrapers.length} scrapers...`);
        const allJobs = [];
        for (const scraper of this.scrapers) {
            console.log(`[ScraperOrchestrator] Executando scraper: ${scraper.name}...`);
            try {
                const jobs = await scraper.scrape();
                console.log(`[ScraperOrchestrator] ${scraper.name} encontrou ${jobs.length} vagas recentes.`);
                allJobs.push(...jobs);
            }
            catch (err) {
                const errorMsg = err.message || String(err);
                console.error(`[ScraperOrchestrator] ⚠️ Falha isolada no scraper ${scraper.name}:`, errorMsg);
                // Enviar alerta direto no Telegram
                const alertText = `⚠️ [ALERTA] O scraper ${scraper.name} falhou: ${errorMsg}`;
                await this.notifier.sendAlert(alertText);
            }
        }
        return allJobs;
    }
}
