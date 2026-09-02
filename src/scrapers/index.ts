import { JobScraper } from './base.js';
import { GupyScraper } from './gupy.js';
import { LinkedInScraper } from './linkedin.js';
import { IndeedScraper } from './indeed.js';
import { GoogleJobsScraper } from './googleJobs.js';
import { TelegramScraper } from './telegram.js';
import { RawJob } from '../types/job.js';

export class ScraperOrchestrator {
  private scrapers: JobScraper[];

  constructor() {
    this.scrapers = [
      new GupyScraper(),
      new LinkedInScraper(),
      new IndeedScraper(),
      new GoogleJobsScraper(),
      new TelegramScraper(),
    ];
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
        console.error(`[ScraperOrchestrator] Falha crítica no scraper ${scraper.name}:`, err);
      }
    }

    return allJobs;
  }
}
