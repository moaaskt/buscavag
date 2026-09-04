import dotenv from 'dotenv';
import { ScraperOrchestrator } from './scrapers/index.js';
import { JobRepository } from './db/repository.js';
import { HermesEvaluator } from './services/hermesEvaluator.js';
import { TelegramNotifier } from './services/telegramNotifier.js';
import { isOlderThanDays } from './utils/date.js';
import { matchesBlacklist, matchesWhitelist } from './config/jobFilters.js';
import { ScraperLogger } from './services/scraperLogger.js';

dotenv.config();

export async function runPipeline(customLogger?: ScraperLogger) {
  const logger = customLogger || new ScraperLogger('Pipeline');
  logger.info(`Iniciando pipeline autônomo de monitoramento de vagas...`, { step: 'START' });

  console.log(`\n======================================================`);
  console.log(`  BUSCAVAG - PIPELINE AUTÔNOMO DE MONITORAMENTO DE VAGAS`);
  console.log(`  Executado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`======================================================\n`);

  const notifier = new TelegramNotifier();
  const orchestrator = new ScraperOrchestrator(notifier, { logger: logger.forScraper('Orchestrator') });
  const repo = new JobRepository();
  const evaluator = new HermesEvaluator();

  // 1. Coleta de vagas de todas as fontes
  console.log('[1/4] Coletando vagas dos conectores...');
  logger.info('[1/4] Coletando vagas dos 24+ conectores...', { step: 'PROGRESS' });
  const rawJobs = await orchestrator.runAll();
  console.log(`-> Total de vagas coletadas: ${rawJobs.length}`);

  // 2. Filtragem de duplicadas, limiar de data (5 dias) e filtros não-tech
  console.log('\n[2/4] Filtrando vagas duplicadas, limiar de 5 dias e filtros não-tech...');
  logger.info('[2/4] Aplicando filtros de duplicidade, recência e termos não-tech...', { step: 'PROGRESS' });
  let newJobsCount = 0;
  let evaluatedCount = 0;
  let approvedCount = 0;
  let blacklistFilteredCount = 0;
  let whitelistFilteredCount = 0;

  for (const job of rawJobs) {
    if (isOlderThanDays(job.publishedAt, 5)) {
      continue;
    }

    // Filtro 1: Blacklist de títulos operacionais/não-tech
    const blacklistCheck = matchesBlacklist(job.title);
    if (blacklistCheck.matched) {
      blacklistFilteredCount++;
      const msg = `[FILTRO BLACKLIST] Vaga descartada: "${job.title}" | Termo: "${blacklistCheck.term}" | ${job.company}`;
      console.log(`   ${msg}`);
      logger.warn(msg, {
        step: 'PROGRESS',
        data: { title: job.title, company: job.company, filter: 'blacklist', term: blacklistCheck.term },
      });
      continue;
    }

    // Filtro 2: Whitelist obrigatória de termos tech
    const whitelistCheck = matchesWhitelist(job.title);
    if (!whitelistCheck.matched) {
      whitelistFilteredCount++;
      const msg = `[FILTRO WHITELIST] Vaga descartada (sem termo tech no título): "${job.title}" | ${job.company}`;
      console.log(`   ${msg}`);
      logger.warn(msg, {
        step: 'PROGRESS',
        data: { title: job.title, company: job.company, filter: 'whitelist' },
      });
      continue;
    }

    if (!repo.exists(job.url, job.company, job.title)) {
      newJobsCount++;

      // 3. Avaliação semântica via Hermes Agent / IA
      console.log(` -> Avaliando vaga: "${job.title}" | ${job.company}`);
      const evalResult = await evaluator.evaluate(job);
      evaluatedCount++;

      if (evalResult.isJuniorFullStack) {
        approvedCount++;
        const msg = `[APROVADA JR] "${job.title}" (${job.company}) Score: ${evalResult.overallScore}/100`;
        console.log(`   ${msg} (Stack: ${evalResult.stackScore} | Nível: ${evalResult.seniorityScore} | Local: ${evalResult.locationScore}) [${evalResult.category}] | ${evalResult.reasoning}`);
        logger.info(msg, {
          step: 'PROGRESS',
          data: { title: job.title, company: job.company, score: evalResult.overallScore, category: evalResult.category },
        });
      } else {
        const msg = `[REJEITADA] "${job.title}" (${job.company}) Score: ${evalResult.overallScore}/100`;
        console.log(`   ${msg} (Stack: ${evalResult.stackScore} | Nível: ${evalResult.seniorityScore} | Local: ${evalResult.locationScore}) [${evalResult.category}] | ${evalResult.reasoning}`);
      }

      // Inserir no banco de dados com análise enriquecida
      repo.insert(job, evalResult);
    }
  }

  const statsMsg = `Estatísticas do ciclo: ${rawJobs.length} coletadas, ${blacklistFilteredCount + whitelistFilteredCount} filtradas, ${evaluatedCount} avaliadas, ${approvedCount} aprovadas.`;
  console.log(`\nEstatísticas do ciclo:`);
  console.log(`- Vagas totais coletadas: ${rawJobs.length}`);
  console.log(`- Descartadas por blacklist de cargo: ${blacklistFilteredCount}`);
  console.log(`- Descartadas por falta de termo tech: ${whitelistFilteredCount}`);
  console.log(`- Vagas novas avaliadas pela IA: ${evaluatedCount}`);
  console.log(`- Vagas aprovadas como Jr Fullstack: ${approvedCount}`);
  logger.info(statsMsg, {
    step: 'PROGRESS',
    data: {
      totalCollected: rawJobs.length,
      blacklistFiltered: blacklistFilteredCount,
      whitelistFiltered: whitelistFilteredCount,
      evaluated: evaluatedCount,
      approved: approvedCount,
    },
  });

  // 4. Envio de Notificações pendentes via Telegram
  console.log('\n[3/4] Buscando vagas aprovadas pendentes de notificação...');
  logger.info('[3/4] Verificando vagas aprovadas para envio de notificações...', { step: 'PROGRESS' });
  const pendingNotifications = repo.getPendingNotifications();
  console.log(`-> Vagas pendentes para envio: ${pendingNotifications.length}`);

  if (pendingNotifications.length > 0) {
    console.log('[4/4] Disparando notificações no Telegram (com delay de 800ms anti-ETIMEDOUT)...');
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const job of pendingNotifications) {
      const sent = await notifier.sendNotification(job);
      if (sent) {
        repo.markAsNotified(job.id);
        console.log(`  ✓ Notificada: "${job.title}" (${job.company})`);
        logger.info(`Notificação enviada: "${job.title}" (${job.company})`, {
          step: 'PROGRESS',
          data: { title: job.title, company: job.company },
        });
      }
      await delay(800); // Aguarda 800ms entre disparos
    }
  } else {
    console.log('[4/4] Nenhuma nova notificação pendente.');
  }

  logger.info(`Pipeline finalizado com sucesso! ${approvedCount} novas vagas adicionadas ao inbox.`, {
    step: 'FINISH',
    data: { approvedCount, evaluatedCount, totalCollected: rawJobs.length },
  });

  console.log(`\n======================================================`);
  console.log(`  PIPELINE FINALIZADO COM SUCESSO`);
  console.log(`======================================================\n`);
}

// Execução direta quando rodado como script principal
const isDirectRun = process.argv[1]?.includes('index');
if (isDirectRun) {
  const notifier = new TelegramNotifier();
  runPipeline().catch(async (err) => {
    console.error('[ERRO CRÍTICO NO PIPELINE]:', err);
    const errorMsg = (err as Error).message || String(err);
    await notifier.sendAlert(`🚨 [ERRO CRÍTICO] O pipeline principal falhou: ${errorMsg}`);
    process.exit(1);
  });
}
