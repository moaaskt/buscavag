import { normalizeUrl, generateJobHash } from './utils/hash.js';
import { JobRepository } from './db/repository.js';
import { RawJob, PlatformSource } from './types/job.js';

async function testPhase63() {
  console.log('--- Testando Fase 63: Banco de Dados & Deduplicação (PlatformSource.LINKEDIN_POSTS) ---\n');

  const repo = new JobRepository();

  // Teste 1: Cobertura Abrangente de Regex para URNs do LinkedIn
  console.log('[1/4] Testando normalização dos 3 formatos de URLs do LinkedIn...');

  const urlActivity = 'https://www.linkedin.com/feed/update/urn:li:activity:7123456789012345678/';
  const urlUgcPost = 'https://www.linkedin.com/feed/update/urn:li:ugcPost:7123456789012345678/';
  const urlSlug = 'https://www.linkedin.com/posts/nome-do-recrutador_vaga-tech-activity-7123456789012345678-xYzW?utm_source=share&utm_medium=member_desktop';

  const normActivity = normalizeUrl(urlActivity, PlatformSource.LINKEDIN_POSTS);
  const normUgcPost = normalizeUrl(urlUgcPost, PlatformSource.LINKEDIN_POSTS);
  const normSlug = normalizeUrl(urlSlug, PlatformSource.LINKEDIN_POSTS);

  console.log(`- Standard Activity: "${urlActivity}" => "${normActivity}"`);
  console.log(`- UGC Post:          "${urlUgcPost}" => "${normUgcPost}"`);
  console.log(`- Slug URL:          "${urlSlug}" => "${normSlug}"`);

  if (normActivity !== 'urn:li:activity:7123456789012345678') {
    throw new Error(`Falha no formato Activity: obtido "${normActivity}"`);
  }
  if (normUgcPost !== 'urn:li:ugcPost:7123456789012345678') {
    throw new Error(`Falha no formato ugcPost: obtido "${normUgcPost}"`);
  }
  if (normSlug !== 'urn:li:activity:7123456789012345678') {
    throw new Error(`Falha no formato Slug URL: obtido "${normSlug}"`);
  }
  console.log('✅ [SUCESSO] Regex normalizou todos os 3 formatos para as respectivas URNs!');

  // Teste 2: Deduplicação por URN independente de variações no título e na empresa
  console.log('\n[2/4] Testando geração de Hash ID determinístico por URN...');

  const hashActivity = generateJobHash(
    urlActivity,
    'Recrutadora Maria',
    'Dev Full Stack Júnior',
    PlatformSource.LINKEDIN_POSTS
  );

  const hashSlug = generateJobHash(
    urlSlug,
    'Startup Beta',
    'Desenvolvedor Fullstack Jr / Node React Pleno',
    PlatformSource.LINKEDIN_POSTS
  );

  console.log(`- Hash Activity (Título: "Dev Full Stack Júnior"): ${hashActivity}`);
  console.log(`- Hash Slug     (Título: "Desenvolvedor Fullstack Jr / Node React Pleno"): ${hashSlug}`);

  if (hashActivity !== hashSlug) {
    throw new Error(`Falha no hashing: Hashes deveriam ser idênticos, mas foram diferentes! (${hashActivity} !== ${hashSlug})`);
  }
  console.log('✅ [SUCESSO] Hashes são 100% idênticos, provando imunidade à volatilidade de títulos da LLM!');

  // Teste 3: Não regressão em outras plataformas (título e empresa ainda compõem o hash)
  console.log('\n[3/4] Testando não-regressão para outras plataformas (Gupy, Indeed, etc)...');
  const gupyHash1 = generateJobHash('https://empresa.gupy.io/job/123', 'Empresa 1', 'Dev Jr', PlatformSource.GUPY);
  const gupyHash2 = generateJobHash('https://empresa.gupy.io/job/123', 'Empresa 1', 'Dev Pleno', PlatformSource.GUPY);

  if (gupyHash1 === gupyHash2) {
    throw new Error('Falha na não-regressão: plataformas comuns devem considerar o título no hash!');
  }
  console.log('✅ [SUCESSO] Outras plataformas continuam usando URL + Empresa + Título no hash.');

  // Teste 4: Integração com o Banco de Dados SQLite e ON CONFLICT(id) DO NOTHING
  console.log('\n[4/4] Testando repo.exists e repo.insert com ON CONFLICT(id) DO NOTHING...');

  const jobA: RawJob = {
    title: 'Dev Full Stack Jr',
    company: 'Tech Recruiter',
    platform: PlatformSource.LINKEDIN_POSTS,
    url: urlActivity,
    description: 'Vaga para júnior no feed!',
    publishedAt: new Date(),
  };

  const jobB: RawJob = {
    title: 'Desenvolvedor Fullstack Júnior - React/Node',
    company: 'Empresa XPTO',
    platform: PlatformSource.LINKEDIN_POSTS,
    url: urlSlug,
    description: 'Mesma postagem raspada em outro ciclo com URL slug!',
    publishedAt: new Date(),
  };

  // Garante limpeza prévia se já existia
  repo.deleteJobs([hashActivity]);

  console.log(`- Existe Job A antes de inserir? ${repo.exists(jobA.url, jobA.company, jobA.title, jobA.platform)}`);
  if (repo.exists(jobA.url, jobA.company, jobA.title, jobA.platform)) {
    throw new Error('Job A não deveria existir no banco antes da inserção!');
  }

  console.log('- Inserindo Job A no banco...');
  const insertedA = repo.insert(jobA, true, 88, 'Aprovado na primeira raspagem');
  console.log(`  Inserido com ID: ${insertedA.id}`);

  console.log(`- Existe Job B (mesmo post, formato slug e título diferente)? ${repo.exists(jobB.url, jobB.company, jobB.title, jobB.platform)}`);
  if (!repo.exists(jobB.url, jobB.company, jobB.title, jobB.platform)) {
    throw new Error('Job B deveria ser detectado como existente pelo repo.exists via URN hash!');
  }
  console.log('✅ [SUCESSO] repo.exists detectou a duplicidade perfeitamente!');

  console.log('- Testando tentativa de inserção do Job B (ON CONFLICT DO NOTHING)...');
  // Não deve lançar erro devido ao ON CONFLICT(id) DO NOTHING
  const insertedB = repo.insert(jobB, true, 90, 'Tentativa de re-inserir duplicata');
  console.log(`  Resultado insert Job B (ID: ${insertedB.id})`);

  const fetched = repo.getJobById(hashActivity);
  if (!fetched || fetched.title !== 'Dev Full Stack Jr') {
    throw new Error('O registro original foi modificado ou perdido!');
  }
  console.log('✅ [SUCESSO] SQLite preservou o registro existente sem conflito de chave primária!');

  // Limpeza
  repo.deleteJobs([hashActivity]);
  console.log('\n✅ Limpeza dos registros de teste concluída com sucesso.');

  console.log('\n🎉 TODOS OS TESTES DA FASE 63 PASSARAM COM 100% DE SUCESSO!');
}

testPhase63().catch((err) => {
  console.error('❌ Erro na execução dos testes da Fase 63:', err);
  process.exit(1);
});
