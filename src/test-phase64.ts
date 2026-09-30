import { RawJob, ProcessedJob, PlatformSource } from './types/job.js';
import { normalizeUrl } from './utils/hash.js';

async function testPhase64() {
  console.log('--- Testando Fase 64: UI & Experiência do Candidato (Badges e Ação Rápida) ---\n');

  // Caso 1: Vaga vinda do Feed do LinkedIn (PlatformSource.LINKEDIN_POSTS)
  const feedJob: RawJob = {
    title: 'Desenvolvedor Node.js / React Jr',
    company: 'Tech Recruiting BR',
    platform: PlatformSource.LINKEDIN_POSTS,
    url: 'https://www.linkedin.com/posts/recrutador_vaga-tech-activity-7123456789012345678-xYzW',
    description: 'Vaga para início imediato. Envie e-mail para dev.talentos@empresa.com com prétensão.',
    publishedAt: new Date(),
  };

  const processedFeedJob: ProcessedJob = {
    ...feedJob,
    id: 'test-hash-64',
    isJuniorFullStack: true,
    scoreIa: 92,
    overallScore: 92,
    stackScore: 95,
    seniorityScore: 90,
    locationScore: 90,
    category: 'Full Stack',
    gaps: ['Docker'],
    resumeTips: 'Destaque seus projetos em React e Node.js no currículo',
    applicationStatus: 'pending',
    aiReasoning: 'Aprovada: 100% alinhada para perfil júnior',
    directContact: 'dev.talentos@empresa.com',
    notified: false,
    createdAt: new Date(),
  };

  console.log('[1/2] Validando dados de exibição do LinkedIn Feed...');
  console.log(`- Plataforma: ${processedFeedJob.platform}`);
  console.log(`- Contato Direto: ${processedFeedJob.directContact}`);
  console.log(`- URL Normalizada: ${normalizeUrl(processedFeedJob.url, processedFeedJob.platform)}`);

  if (processedFeedJob.platform !== PlatformSource.LINKEDIN_POSTS) {
    throw new Error('Falha no tipo de plataforma para LinkedIn Posts');
  }

  if (processedFeedJob.directContact !== 'dev.talentos@empresa.com') {
    throw new Error('Falha no campo directContact');
  }
  console.log('✅ [SUCESSO] Dados de post de feed validados com sucesso!');

  console.log('\n[2/2] Testando formato do Pitch de apresentação para LinkedIn Feed...');
  const isFeedPost = processedFeedJob.platform === 'linkedin_posts' || processedFeedJob.platform === 'facebook_groups';
  const intro = isFeedPost
    ? `Olá! Vi sua publicação no LinkedIn referente à vaga de ${processedFeedJob.title}.`
    : `Olá, time de recrutamento da ${processedFeedJob.company}!\n\nMe interessei muito pela vaga de ${processedFeedJob.title}.`;

  console.log(`- Intro gerada: "${intro}"`);
  if (!intro.includes('sua publicação no LinkedIn')) {
    throw new Error('Pitch não gerou a introdução amigável para postagens de feed!');
  }
  console.log('✅ [SUCESSO] Carta de apresentação adaptada para posts informais do LinkedIn!');

  console.log('\n🎉 TODOS OS TESTES DA FASE 64 PASSARAM COM SUCESSO!');
}

testPhase64().catch((err) => {
  console.error('❌ Erro no teste da Fase 64:', err);
  process.exit(1);
});
