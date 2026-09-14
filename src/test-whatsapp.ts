import { whatsappService } from './services/whatsappService.js';
import { PlatformSource, ProcessedJob } from './types/job.js';

async function testWhatsAppEngine() {
  console.log('--- [TESTE] WhatsApp Notification Engine (Evolution API / Webhook) ---');

  // 1. Status do Serviço
  const status = whatsappService.getStatus();
  console.log('\n1. Status do Serviço:');
  console.log(JSON.stringify(status, null, 2));

  // 2. Vaga Mock para Teste de Alto Match (Score 92)
  const highMatchJob: ProcessedJob = {
    id: 'mock-high-match-01',
    title: 'Desenvolvedor Full Stack Jr (React & Node.js)',
    company: 'Fintech Brasil',
    platform: PlatformSource.GUPY,
    url: 'https://fintech.gupy.io/job/12345',
    description: 'Vaga focada em desenvolvimento de APIs Node.js/TypeScript e dashboards React.',
    publishedAt: new Date(),
    location: '100% Remoto (Brasil)',
    isJuniorFullStack: true,
    scoreIa: 92,
    overallScore: 92,
    stackScore: 95,
    seniorityScore: 90,
    locationScore: 100,
    gaps: ['Docker Básico'],
    aiReasoning: 'Excelente alinhamento de stack e senioridade compatível.',
    notified: false,
    createdAt: new Date(),
  };

  // 3. Teste de Formatação de Alerta
  console.log('\n2. Teste de Formatação de Mensagem de Alerta (WhatsApp Markdown):');
  const alertText = whatsappService.formatJobAlert(highMatchJob, true, 'Moacir Neto');
  console.log(alertText);

  // 4. Teste de Geração de Carta de Apresentação
  console.log('\n3. Teste de Geração de Carta de Apresentação (Pitch):');
  const coverLetter = whatsappService.generateCoverLetter({
    title: highMatchJob.title,
    company: highMatchJob.company,
    description: highMatchJob.description,
  }, 'Moacir Neto');
  console.log(coverLetter);

  // 5. Teste de Envio no Modo Mock
  console.log('\n4. Teste de Disparo no Modo Mock:');
  const sendResult = await whatsappService.sendJobNotification(highMatchJob, '5548999998888', {
    includeCoverLetter: true,
  });
  console.log('Resultado do envio:', sendResult);

  if (!sendResult.success) {
    throw new Error(`Falha no envio de notificação WhatsApp: ${sendResult.error}`);
  }

  // 6. Teste de Barreira de Score Mínimo (Vaga com Score 60)
  console.log('\n5. Teste de Validação de Threshold Mínimo:');
  const lowMatchJob: ProcessedJob = {
    ...highMatchJob,
    id: 'mock-low-match-02',
    overallScore: 60,
    scoreIa: 60,
  };
  const lowResult = await whatsappService.sendJobNotification(lowMatchJob, '5548999998888', {
    force: false,
  });
  console.log('Tentativa com score 60 (esperado rejeição de threshold):', lowResult);

  if (lowResult.success) {
    throw new Error('A vaga com score 60 deveria ter sido bloqueada pelo threshold mínimo!');
  }

  console.log('\n✓ Todos os testes da Engine de Notificação WhatsApp passaram com sucesso!');
}

testWhatsAppEngine().catch((err) => {
  console.error('[ERRO NO TESTE WHATSAPP]:', err);
  process.exit(1);
});
