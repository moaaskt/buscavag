import dotenv from 'dotenv';
dotenv.config();

import { JobScraper } from '../src/scrapers/base.js';
import { GupyScraper } from '../src/scrapers/gupy.js';
import { LinkedInScraper } from '../src/scrapers/linkedin.js';
import { IndeedScraper } from '../src/scrapers/indeed.js';
import { GoogleJobsScraper } from '../src/scrapers/googleJobs.js';
import { TelegramScraper } from '../src/scrapers/telegram.js';
import { ProgramathorScraper } from '../src/scrapers/programathor.js';
import { RemotarScraper } from '../src/scrapers/remotar.js';
import { CathoScraper } from '../src/scrapers/catho.js';
import { GlassdoorScraper } from '../src/scrapers/glassdoor.js';
// Regionais SC
import { SaoJoseScraper } from '../src/scrapers/saoJose.js';
import { VagasScScraper } from '../src/scrapers/vagasSc.js';
import { VagasFloripaScraper } from '../src/scrapers/vagasFloripa.js';
import { EmpregaPalhocaScraper } from '../src/scrapers/empregaPalhoca.js';
import { NerdinScraper } from '../src/scrapers/nerdin.js';
// Nacionais
import { InfojobsScraper } from '../src/scrapers/infojobs.js';
import { ChaworkScraper } from '../src/scrapers/chawork.js';
import { TrabalhaBrasilScraper } from '../src/scrapers/trabalhaBrasil.js';
import { BneScraper } from '../src/scrapers/bne.js';
import { BebeeScraper } from '../src/scrapers/bebee.js';
import { EmpregosScraper } from '../src/scrapers/empregos.js';
import { RecrutaSimplesScraper } from '../src/scrapers/recrutaSimples.js';
// ATSs
import { RecruteiEmpregosScraper } from '../src/scrapers/recruteiEmpregos.js';
import { QuickinScraper } from '../src/scrapers/quickin.js';
import { RecruteiJobsScraper } from '../src/scrapers/recruteiJobs.js';
import { PandapeScraper } from '../src/scrapers/pandape.js';
// Tech Especializadas
import { GeekHunterScraper } from '../src/scrapers/geekhunter.js';
import { ReveloScraper } from '../src/scrapers/revelo.js';
import { NoventaENoveJobsScraper } from '../src/scrapers/noventaENoveJobs.js';
import { SolidesScraper } from '../src/scrapers/solides.js';
import { RunTalentScraper } from '../src/scrapers/runTalent.js';
import { EmpregareScraper } from '../src/scrapers/empregare.js';
import { TramposScraper } from '../src/scrapers/trampos.js';
// Freelance
import { Freelas99Scraper } from '../src/scrapers/99freelas.js';
import { WorkanaScraper } from '../src/scrapers/workana.js';

import { runWithConcurrencyLimit, withTimeout } from '../src/utils/concurrency.js';

type AuditStatus = 'SUCCESS' | 'WARNING' | 'FAILED';

interface ScraperAuditResult {
  source: string;
  status: AuditStatus;
  jobsCount: number;
  durationSeconds: number;
  error?: string;
}

const CONCURRENCY_LIMIT = 3;
const SCRAPER_TIMEOUT_MS = 45000;

function getAllScrapers(): JobScraper[] {
  return [
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
    new NerdinScraper(),
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
    // Tech Especializadas
    new GeekHunterScraper(),
    new ReveloScraper(),
    new NoventaENoveJobsScraper(),
    new SolidesScraper(),
    new RunTalentScraper(),
    new EmpregareScraper(),
    new TramposScraper(),
    // Freelance
    new Freelas99Scraper(),
    new WorkanaScraper(),
  ];
}

async function auditSingleScraper(scraper: JobScraper): Promise<ScraperAuditResult> {
  const startTime = Date.now();
  try {
    const jobs = await withTimeout(
      scraper.scrape(),
      SCRAPER_TIMEOUT_MS,
      `Timeout após ${SCRAPER_TIMEOUT_MS / 1000}s`
    );
    const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));
    const count = Array.isArray(jobs) ? jobs.length : 0;

    return {
      source: scraper.name,
      status: count > 0 ? 'SUCCESS' : 'WARNING',
      jobsCount: count,
      durationSeconds,
    };
  } catch (err) {
    const durationSeconds = Number(((Date.now() - startTime) / 1000).toFixed(2));
    const rawError = (err as Error).message || String(err);
    const cleanError = rawError.replace(/\n+/g, ' ').substring(0, 100);

    return {
      source: scraper.name,
      status: 'FAILED',
      jobsCount: 0,
      durationSeconds,
      error: cleanError,
    };
  }
}

async function runAudit() {
  const scrapers = getAllScrapers();
  console.log(`\n======================================================`);
  console.log(` 🔍 AUDITORIA DE SCRAPERS - BUSCAVAG (${scrapers.length} FONTES)`);
  console.log(` ⚙️  Concorrência: ${CONCURRENCY_LIMIT} | Timeout: ${SCRAPER_TIMEOUT_MS / 1000}s`);
  console.log(`======================================================\n`);

  const globalStart = Date.now();
  let completed = 0;

  const results = await runWithConcurrencyLimit(scrapers, CONCURRENCY_LIMIT, async (scraper) => {
    const res = await auditSingleScraper(scraper);
    completed++;
    const icon = res.status === 'SUCCESS' ? '✅' : res.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`[${completed.toString().padStart(2, '0')}/${scrapers.length}] ${icon} ${res.source.padEnd(22)} -> ${res.status.padEnd(7)} | ${res.jobsCount.toString().padStart(3, ' ')} vagas | ${res.durationSeconds}s${res.error ? ` (${res.error})` : ''}`);
    return res;
  });

  const totalDuration = ((Date.now() - globalStart) / 1000).toFixed(2);

  // Formatar tabela resumida
  console.log(`\n📊 TABELA DETALHADA DE RESULTADOS:`);
  console.table(
    results.map((r) => ({
      'Fonte': r.source,
      'Status': r.status === 'SUCCESS' ? 'SUCCESS ✅' : r.status === 'WARNING' ? 'WARNING ⚠️' : 'FAILED ❌',
      'Vagas': r.jobsCount,
      'Tempo (s)': r.durationSeconds,
      'Erro': r.error || '-',
    }))
  );

  // Métricas finais
  const successList = results.filter((r) => r.status === 'SUCCESS');
  const warningList = results.filter((r) => r.status === 'WARNING');
  const failedList = results.filter((r) => r.status === 'FAILED');
  const totalJobs = results.reduce((acc, curr) => acc + curr.jobsCount, 0);

  console.log(`\n======================================================`);
  console.log(` 📋 PAINEL DE RESUMO DA AUDITORIA`);
  console.log(`======================================================`);
  console.log(` • Total de Fontes Auditadas : ${scrapers.length}`);
  console.log(` • Ativas com Sucesso (✅)   : ${successList.length} (${((successList.length / scrapers.length) * 100).toFixed(1)}%)`);
  console.log(` • Fontes Zeradas (⚠️)       : ${warningList.length}`);
  console.log(` • Fontes com Falha (❌)     : ${failedList.length}`);
  console.log(` • Total Geral de Vagas      : ${totalJobs} vagas capturadas`);
  console.log(` • Tempo Total de Auditoria  : ${totalDuration}s`);
  console.log(`======================================================\n`);
}

runAudit().catch((err) => {
  console.error('Erro fatal na auditoria:', err);
  process.exit(1);
});
