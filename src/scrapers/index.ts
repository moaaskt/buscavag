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
import { runWithConcurrencyLimit, withTimeout } from '../utils/concurrency.js';

export interface OrchestratorOptions {
  concurrency?: number;
  timeoutPerScraperMs?: number;
}

export interface ScraperExecutionMetric {
  name: string;
  durationMs: number;
  jobsFound: number;
  success: boolean;
  error?: string;
}

export class ScraperOrchestrator {
  private scrapers: JobScraper[];
  private notifier: TelegramNotifier;
  private concurrency: number;
  private timeoutPerScraperMs: number;

  constructor(notifier?: TelegramNotifier, options?: OrchestratorOptions) {
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
    this.concurrency = options?.concurrency || 5;
    this.timeoutPerScraperMs = options?.timeoutPerScraperMs || 45000;
  }

  async runAll(): Promise<RawJob[]> {
    console.log(`[ScraperOrchestrator] Iniciando execução paralela de ${this.scrapers.length} scrapers (Concorrência: ${this.concurrency}, Timeout: ${this.timeoutPerScraperMs / 1000}s)...`);
    const startTime = Date.now();
    const metrics: ScraperExecutionMetric[] = [];
    const allJobs: RawJob[] = [];

    const results = await runWithConcurrencyLimit(this.scrapers, this.concurrency, async (scraper) => {
      const scraperStart = Date.now();
      console.log(`[ScraperOrchestrator] 🚀 Iniciando: ${scraper.name}...`);

      try {
        const jobs = await withTimeout(
          scraper.scrape(),
          this.timeoutPerScraperMs,
          `Tempo limite excedido (${this.timeoutPerScraperMs / 1000}s)`
        );

        const durationMs = Date.now() - scraperStart;
        console.log(`[ScraperOrchestrator] ✅ ${scraper.name} finalizado em ${(durationMs / 1000).toFixed(1)}s com ${jobs.length} vagas.`);

        metrics.push({
          name: scraper.name,
          durationMs,
          jobsFound: jobs.length,
          success: true,
        });

        return jobs;
      } catch (err) {
        const durationMs = Date.now() - scraperStart;
        const errorMsg = (err as Error).message || String(err);
        console.error(`[ScraperOrchestrator] ⚠️ Falha isolada no scraper ${scraper.name} após ${(durationMs / 1000).toFixed(1)}s: ${errorMsg}`);

        metrics.push({
          name: scraper.name,
          durationMs,
          jobsFound: 0,
          success: false,
          error: errorMsg,
        });

        // Enviar alerta não bloqueante no Telegram
        const alertText = `⚠️ [ALERTA] O scraper ${scraper.name} falhou: ${errorMsg}`;
        this.notifier.sendAlert(alertText).catch((telegramErr) => {
          console.warn(`[ScraperOrchestrator] Erro ao enviar alerta Telegram:`, (telegramErr as Error).message);
        });

        return [] as RawJob[];
      }
    });

    for (const jobBatch of results) {
      allJobs.push(...jobBatch);
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[ScraperOrchestrator] 🏁 Coleta paralela concluída em ${totalDuration}s. Total de ${allJobs.length} vagas coletadas.`);

    return allJobs;
  }
}
