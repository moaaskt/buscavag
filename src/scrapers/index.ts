import { JobScraper } from './base.js';
import { GupyScraper } from './gupy.js';
import { LinkedInScraper } from './linkedin.js';
import { IndeedScraper } from './indeed.js';
import { GoogleJobsScraper } from './googleJobs.js';
import { TelegramScraper } from './telegram.js';
import { RawJob } from '../types/job.js';
import { TelegramNotifier } from '../services/telegramNotifier.js';

export class ScraperOrchestrator {
  private scrapers: JobScraper[];
  private notifier: TelegramNotifier;

  constructor(notifier?: TelegramNotifier) {
    this.scrapers = [
      new GupyScraper(),
      new LinkedInScraper(),
      new IndeedScraper(),
      new GoogleJobsScraper(),
      new TelegramScraper(),
    ];
    this.notifier = notifier || new TelegramNotifier();
  }

  async runAll(): Promise<RawJob[]> {
    console.log(`[ScraperOrchestrator] Iniciando execução de ${this.scrapers.length} scrapers...`);
    const allJobs: RawJob[] = [];

    for (const scraper of this.scrapers) {
      console.log(`[ScraperOrchestrator] Executando scraper: ${scraper.name}...`);
      try {
        const jobs = await scraper.scrape();
        console.log(`[ScraperOrchestrator] ${scraper.name} encontrou ${jobs.length} vagas recentes.`);
        allJobs.push(...jobs);
      } catch (err) {
        const errorMsg = (err as Error).message || String(err);
        console.error(`[ScraperOrchestrator] ⚠️ Falha isolada no scraper ${scraper.name}:`, errorMsg);
        
        // Enviar alerta direto no Telegram
        const alertText = `⚠️ [ALERTA] O scraper ${scraper.name} falhou: ${errorMsg}`;
        await this.notifier.sendAlert(alertText);
      }
    }

    return allJobs;
  }
}
