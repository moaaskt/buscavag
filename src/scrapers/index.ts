import { JobScraper } from './base.js';
import { GupyScraper } from './gupy.js';
import { LinkedInScraper } from './linkedin.js';
import { IndeedScraper } from './indeed.js';
import { GoogleJobsScraper } from './googleJobs.js';
import { TelegramScraper } from './telegram.js';
import { ProgramathorScraper } from './programathor.js';
import { RemotarScraper } from './remotar.js';
import { CathoScraper } from './catho.js';
import { GlassdoorScraper } from './glassdoor.js';
// Regionais SC
import { SaoJoseScraper } from './saoJose.js';
import { VagasScScraper } from './vagasSc.js';
import { VagasFloripaScraper } from './vagasFloripa.js';
import { EmpregaPalhocaScraper } from './empregaPalhoca.js';
// Nacionais
import { InfojobsScraper } from './infojobs.js';
import { ChaworkScraper } from './chawork.js';
import { TrabalhaBrasilScraper } from './trabalhaBrasil.js';
import { BneScraper } from './bne.js';
import { BebeeScraper } from './bebee.js';
import { EmpregosScraper } from './empregos.js';
import { RecrutaSimplesScraper } from './recrutaSimples.js';
// ATSs
import { RecruteiEmpregosScraper } from './recruteiEmpregos.js';
import { QuickinScraper } from './quickin.js';
import { RecruteiJobsScraper } from './recruteiJobs.js';
import { PandapeScraper } from './pandape.js';

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
      new ProgramathorScraper(),
      new RemotarScraper(),
      new CathoScraper(),
      new GlassdoorScraper(),
      // Regionais SC
      new SaoJoseScraper(),
      new VagasScScraper(),
      new VagasFloripaScraper(),
      new EmpregaPalhocaScraper(),
      // Nacionais
      new InfojobsScraper(),
      new ChaworkScraper(),
      new TrabalhaBrasilScraper(),
      new BneScraper(),
      new BebeeScraper(),
      new EmpregosScraper(),
      new RecrutaSimplesScraper(),
      // ATSs
      new RecruteiEmpregosScraper(),
      new QuickinScraper(),
      new RecruteiJobsScraper(),
      new PandapeScraper(),
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
