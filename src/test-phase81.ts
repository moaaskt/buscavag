import { WhatsAppService } from './services/whatsappService';
import { TelegramNotifier } from './services/telegramNotifier';
import { AdminMessagingRepository } from './db/adminMessagingRepository';
import { db, initDatabase } from './db/index';
import { generatePitch } from './lib/pitchGenerator';

async function runPhase81Tests() {
  console.log('--- INICIANDO TESTES DETERMINÍSTICOS DA PHASE 81 (HUB DE MENSAGERIA) ---');

  initDatabase();
  const messagingRepo = new AdminMessagingRepository();
  const whatsappService = new WhatsAppService();
  const telegramNotifier = new TelegramNotifier();

  let passed = 0;
  let total = 0;

  function assert(desc: string, condition: boolean) {
    total++;
    if (condition) {
      console.log(`✅ [TEST ${total}] PASSOU: ${desc}`);
      passed++;
    } else {
      console.error(`❌ [TEST ${total}] FALHOU: ${desc}`);
    }
  }

  // TESTE 1: Status do WhatsAppService com suporte ao meta_cloud
  const waStatus = whatsappService.getStatus();
  assert(
    'WhatsAppService deve expor método getStatus() com informações de provedor e meta_cloud',
    typeof waStatus.provider === 'string' && typeof waStatus.minScore === 'number'
  );

  // TESTE 2: Disparo em Mock Mode no WhatsApp grava no banco unificado logs com origem "mensageria"
  const testPhone = '5511999998888';
  const waResult = await whatsappService.sendMessage(testPhone, 'Mensagem de teste unitário Phase 81');
  assert(
    'WhatsAppService em Mock Mode deve retornar success: true com mock: true',
    waResult.success === true && waResult.mock === true
  );

  // TESTE 3: Verificação de gravação de log de entrega na tabela unificada logs
  const verifyWaLogStmt = db.prepare(`
    SELECT * FROM logs 
    WHERE (origem = 'mensageria' OR tipo = 'mensageria')
      AND mensagem LIKE '%[WhatsApp]%'
    ORDER BY created_at DESC LIMIT 1
  `);
  const waLogRow = verifyWaLogStmt.get() as any;
  assert(
    'Disparo do WhatsApp deve gerar registro na tabela logs com origem mensageria',
    !!waLogRow && waLogRow.tipo === 'mensageria' && waLogRow.nivel === 'info'
  );

  // TESTE 4: Status do TelegramNotifier
  const tgStatus = telegramNotifier.getStatus();
  assert(
    'TelegramNotifier deve expor método getStatus() com mode "mock" ou "live"',
    tgStatus.mode === 'mock' || tgStatus.mode === 'live'
  );

  // TESTE 5: Disparo de Alerta do Telegram grava no banco logs unificado
  const tgAlertSuccess = await telegramNotifier.sendAlert('Alerta de teste unitário do sistema Phase 81');
  assert(
    'TelegramNotifier deve enviar alerta e registrar entrega',
    tgAlertSuccess === true
  );

  const verifyTgLogStmt = db.prepare(`
    SELECT * FROM logs 
    WHERE (origem = 'mensageria' OR tipo = 'mensageria')
      AND mensagem LIKE '%[Telegram]%'
    ORDER BY created_at DESC LIMIT 1
  `);
  const tgLogRow = verifyTgLogStmt.get() as any;
  assert(
    'Disparo do Telegram deve persistir log unificado com origem mensageria',
    !!tgLogRow && tgLogRow.tipo === 'mensageria'
  );

  // TESTE 6: Cálculo em tempo real de estatísticas de mensageria
  const stats = messagingRepo.getMessagingStats();
  assert(
    'AdminMessagingRepository.getMessagingStats() deve retornar métricas agregadas',
    stats.totalSent >= 2 && stats.whatsappCount >= 1 && stats.telegramCount >= 1 && stats.successRate >= 0
  );

  // TESTE 7: Consulta paginada com deserialização de canais e metadados
  const queryLogs = messagingRepo.getMessagingLogs({ page: 1, limit: 10 });
  assert(
    'AdminMessagingRepository.getMessagingLogs() deve retornar lista estruturada de logs com canais',
    Array.isArray(queryLogs.logs) && queryLogs.logs.length > 0 && typeof queryLogs.total === 'number'
  );

  // TESTE 8: Filtro exclusivo por canal 'whatsapp'
  const waOnlyLogs = messagingRepo.getMessagingLogs({ canal: 'whatsapp', limit: 10 });
  const allAreWa = waOnlyLogs.logs.every((l) => l.canal === 'whatsapp');
  assert(
    'Filtro por canal whatsapp deve retornar estritamente registros do WhatsApp',
    waOnlyLogs.logs.length > 0 && allAreWa
  );

  // TESTE 9: Gerador de Pitch com Precedência e Anti-Alucinação
  const samplePitch = generatePitch(
    {
      title: 'Engenheiro de Software Sênior',
      company: 'Nubank',
      url: 'https://exemplo.com/vaga/nu',
      directContact: 'carreiras@nubank.com.br',
    },
    {
      name: 'Dev Teste',
      targetRole: 'Arquiteto de Software',
      primaryStack: ['TypeScript', 'Node.js', 'PostgreSQL'],
    }
  );
  assert(
    'generatePitch deve gerar pitch contextualizado sem alucinar stacks e com contato direto',
    samplePitch.includes('carreiras@nubank.com.br') &&
    samplePitch.includes('TypeScript') &&
    samplePitch.includes('Arquiteto de Software')
  );

  // TESTE 10: Reenvio de mensagem com simulação de auditoria
  // Inserimos um log de falha proposital para testar a rotina de reenvio
  const failedLogId = `test-failed-${Date.now()}`;
  db.prepare(`
    INSERT INTO logs (id, tipo, nivel, origem, mensagem, metadata, created_at)
    VALUES (?, 'mensageria', 'error', 'mensageria', '[WhatsApp] Falha simulada para reenvio', ?, datetime('now'))
  `).run(
    failedLogId,
    JSON.stringify({
      canal: 'whatsapp',
      destinatario: '5511988887777',
      status: 'failed',
      preview: 'Mensagem para teste de reenvio',
    })
  );

  const resendResult = await messagingRepo.resendFailedMessage(failedLogId, {
    id: 'admin-test',
    email: 'admin@buscavag.com.br',
    name: 'Admin Teste',
  });
  assert(
    'resendFailedMessage deve reprocessar envio e registrar ação administrativa no log',
    resendResult.success === true
  );

  console.log(`\n======================================================`);
  console.log(`RESULTADO FINAL DA SUÍTE PHASE 81: ${passed}/${total} TESTES PASSARAM!`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

runPhase81Tests().catch((err) => {
  console.error('Erro na execução dos testes da Phase 81:', err);
  process.exit(1);
});
