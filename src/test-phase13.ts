import { HermesEvaluator } from './services/hermesEvaluator.js';
import { PlatformSource, RawJob } from './types/job.js';

async function testPhase13() {
  console.log('=== TESTE DE IA & HEURÍSTICA: IOT & AUTOMAÇÃO RESIDENCIAL (FASE 13) ===\n');

  const evaluator = new HermesEvaluator();

  const mockJobs: RawJob[] = [
    {
      title: 'Desenvolvedor IoT / Sistemas Embarcados Junior',
      company: 'SmartHome Tech',
      platform: PlatformSource.LINKEDIN,
      url: 'https://exemplo.com/vaga-iot-1',
      description: 'Procuramos dev junior para trabalhar com ESP32, protocolos MQTT e integrações de automação residencial com Home Assistant e APIs REST em Node.js.',
      publishedAt: new Date(),
      location: 'Remoto',
    },
    {
      title: 'Programador Junior (Automação Residencial / ESP32)',
      company: 'Intelbras Partner',
      platform: PlatformSource.SAO_JOSE,
      url: 'https://exemplo.com/vaga-iot-2',
      description: 'Desenvolvimento de firmwares em C/C++ para ESP32 e ESP8266, dashboards Web com TypeScript e comunicação via MQTT / WebSockets.',
      publishedAt: new Date(),
      location: 'São José, SC',
    },
    {
      title: 'Desenvolvedor Full Stack Node.js / React Jr',
      company: 'Fintech Brasil',
      platform: PlatformSource.INFOJOBS,
      url: 'https://exemplo.com/vaga-web-1',
      description: 'Desenvolvimento de APIs em Node.js / NestJS, banco de dados PostgreSQL e frontend em React / Next.js.',
      publishedAt: new Date(),
      location: 'Remoto',
    },
  ];

  for (const job of mockJobs) {
    console.log(`--------------------------------------------------`);
    console.log(`Vaga: "${job.title}" (${job.company}) - ${job.location}`);
    
    // Heurística
    const resultH = evaluator.evaluateHeuristic(job);
    console.log(`[Heurística] Categoria: "${resultH.category}" | Score: ${resultH.overallScore}/100 (Stack: ${resultH.stackScore}) | Aprovada? ${resultH.isJuniorFullStack}`);
    console.log(`   Dica: ${resultH.resumeTips}`);
    console.log(`   Parecer: ${resultH.reasoning}`);
  }

  console.log(`\n==================================================`);
  console.log(`✅ Validação de especialização em IoT concluída.`);
  console.log(`==================================================\n`);
}

testPhase13().catch(console.error);
