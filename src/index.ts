import dotenv from 'dotenv';
import { ScraperOrchestrator } from './scrapers/index.js';
import { JobRepository } from './db/repository.js';
import { HermesEvaluator } from './services/hermesEvaluator.js';
import { TelegramNotifier } from './services/telegramNotifier.js';
import { isOlderThanDays } from './utils/date.js';

dotenv.config();

export async function runPipeline() {
  console.log(`\n======================================================`);
  console.log(`  BUSCAVAG - PIPELINE AUTÔNOMO DE MONITORAMENTO DE VAGAS`);
  console.log(`  Executado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`======================================================\n`);

  const notifier = new TelegramNotifier();
  const orchestrator = new ScraperOrchestrator(notifier);
  const repo = new JobRepository();
  const evaluator = new HermesEvaluator();

  // 1. Coleta de vagas de todas as fontes
  console.log('[1/4] Coletando vagas dos conectores...');
  const rawJobs = await orchestrator.runAll();
  console.log(`-> Total de vagas coletadas: ${rawJobs.length}`);

  // 2. Filtragem de duplicadas e limiar de data (5 dias)
  console.log('\n[2/4] Filtrando vagas duplicadas e verificando limiar de 5 dias...');
  let newJobsCount = 0;
  let evaluatedCount = 0;
  let approvedCount = 0;

  for (const job of rawJobs) {
    if (isOlderThanDays(job.publishedAt, 5)) {
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
        console.log(`   [APROVADA JR] Score: ${evalResult.overallScore}/100 (Stack: ${evalResult.stackScore} | Nível: ${evalResult.seniorityScore} | Local: ${evalResult.locationScore}) [${evalResult.category}] | ${evalResult.reasoning}`);
      } else {
        console.log(`   [REJEITADA] Score: ${evalResult.overallScore}/100 (Stack: ${evalResult.stackScore} | Nível: ${evalResult.seniorityScore} | Local: ${evalResult.locationScore}) [${evalResult.category}] | ${evalResult.reasoning}`);
      }

      // Inserir no banco de dados com análise enriquecida
      repo.insert(job, evalResult);
    }
  }

  console.log(`\nEstatísticas do ciclo:`);
  console.log(`- Vagas novas processadas: ${newJobsCount}`);
  console.log(`- Vagas aprovadas como Jr Fullstack: ${approvedCount}`);

  // 4. Envio de Notificações pendentes via Telegram
  console.log('\n[3/4] Buscando vagas aprovadas pendentes de notificação...');
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
      }
      await delay(800); // Aguarda 800ms entre disparos
    }
  } else {
    console.log('[4/4] Nenhuma nova notificação pendente.');
  }

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
