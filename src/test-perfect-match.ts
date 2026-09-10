import { CandidateMatcher, CandidateContext } from './services/candidateMatcher';
import { CandidateRepository } from './db/candidateRepository';
import crypto from 'crypto';

async function runMatchTests() {
  console.log('🧪 Iniciando Testes Automatizados da Fase 38 (Algoritmo de Match Perfeito)...\n');

  const matcher = new CandidateMatcher();
  const repo = new CandidateRepository();

  // 1. Cenário: Candidato Full Stack Jr (React/Node/TypeScript)
  console.log('1️⃣  Testando Cálculo Matemático de Match por Perfil...');
  const testCandidate: CandidateContext = {
    userId: 'candidate-test-123',
    targetRole: 'Desenvolvedor Full Stack',
    seniority: 'Júnior',
    preferredWorkModels: ['Remoto', 'Híbrido'],
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'Tailwind CSS', 'Docker', 'ESP32'],
    bio: 'Desenvolvedor focado em ecossistema web moderno e IoT.',
  };

  // Vaga 1: Full Stack Jr React/Node (Match Quase Perfeito)
  const jobHighMatch = {
    id: 'job-high-1',
    title: 'Desenvolvedor Full Stack Junior (React / Node)',
    company: 'Tech Startup BR',
    location: 'Remoto, Brasil',
    description: 'Buscamos Dev Full Stack Jr com conhecimentos em React, TypeScript, Node.js, PostgreSQL e Tailwind CSS. Atuação 100% remota.',
    platform: 'Gupy',
  };

  const matchHigh = matcher.calculateMatch(jobHighMatch, testCandidate);
  console.log(`   [Vaga 1 - High Match]: "${jobHighMatch.title}"`);
  console.log(`   -> Score Geral: ${matchHigh.overallScore}% (Stack: ${matchHigh.stackScore}%, Role: ${matchHigh.roleScore}%, Seniority: ${matchHigh.seniorityScore}%, Loc: ${matchHigh.locationScore}%)`);
  console.log(`   -> Skills Atendidas: ${matchHigh.matchedSkills.join(', ')}`);
  console.log(`   -> Gaps: ${matchHigh.missingSkills.join(', ') || 'Nenhum'}`);
  console.log(`   -> Parecer: ${matchHigh.matchReasoning}`);

  if (matchHigh.overallScore < 80 || !matchHigh.isStrongMatch) {
    throw new Error('Falha: Vaga altamente aderente recebeu score inferior a 80%!');
  }
  if (!matchHigh.matchedSkills.includes('React') || !matchHigh.matchedSkills.includes('Typescript')) {
    throw new Error('Falha: Skills essenciais não foram marcadas como atendidas!');
  }

  // Vaga 2: Python / Django Pleno (Match Médio)
  const jobMediumMatch = {
    id: 'job-medium-2',
    title: 'Desenvolvedor Backend Pleno Python',
    company: 'Fintech DataCorp',
    location: 'Remoto',
    description: 'Vaga para Backend com Python, Django, PostgreSQL, Docker e AWS.',
    platform: 'Programathor',
  };

  const matchMedium = matcher.calculateMatch(jobMediumMatch, testCandidate);
  console.log(`\n   [Vaga 2 - Medium Match]: "${jobMediumMatch.title}"`);
  console.log(`   -> Score Geral: ${matchMedium.overallScore}%`);
  console.log(`   -> Skills Atendidas: ${matchMedium.matchedSkills.join(', ')}`);
  console.log(`   -> Gaps Identificados: ${matchMedium.missingSkills.join(', ')}`);

  if (matchMedium.overallScore >= matchHigh.overallScore) {
    throw new Error('Falha: Vaga com stack divergente recebeu score maior ou igual à vaga perfeita!');
  }

  // Vaga 3: Java / Spring Boot Senior (Match Baixo)
  const jobLowMatch = {
    id: 'job-low-3',
    title: 'Arquiteto de Software / Sênior Java & Spring Boot',
    company: 'Enterprise Bank',
    location: 'São Paulo (Presencial)',
    description: 'Necessário 8+ anos em Java, Spring Boot, Microserviços, Kafka, Kubernetes e Oracle.',
    platform: 'Catho',
  };

  const matchLow = matcher.calculateMatch(jobLowMatch, testCandidate);
  console.log(`\n   [Vaga 3 - Low Match]: "${jobLowMatch.title}"`);
  console.log(`   -> Score Geral: ${matchLow.overallScore}%`);
  console.log(`   -> Parecer: ${matchLow.matchReasoning}`);

  if (matchLow.overallScore > 60) {
    throw new Error('Falha: Vaga sênior/java presencial deveria ter pontuação baixa!');
  }

  // 2. Testando Ranqueamento de Vagas
  console.log('\n2️⃣  Testando Ranqueamento Automático de Lista de Vagas...');
  const jobsList = [jobLowMatch, jobHighMatch, jobMediumMatch];
  const ranked = matcher.rankJobs(jobsList, testCandidate);

  console.log('   Ordem ranqueada:');
  ranked.forEach((r, idx) => {
    console.log(`   #${idx + 1}: ${r.job.title} -> ${r.match.overallScore}% Match`);
  });

  if (ranked[0].job.id !== 'job-high-1' || ranked[ranked.length - 1].job.id !== 'job-low-3') {
    throw new Error('Falha no ordenamento decrescente de compatibilidade!');
  }
  console.log('   ✅ Ordenamento validado com sucesso!');

  // 3. Testando Repositório e Estatísticas no SQLite
  console.log('\n3️⃣  Testando Integração com CandidateRepository...');
  const testUserEmail = `matcher_test_${Date.now()}@buscavag.com`;
  const createdUser = repo.createUser({
    id: crypto.randomUUID(),
    email: testUserEmail,
    password_hash: 'dummy',
    name: 'Candidato Matcher Teste',
    tier: 'free',
  });

  repo.upsertProfile(createdUser.id, {
    target_role: 'Desenvolvedor Full Stack',
    seniority: 'Júnior',
    skills: ['TypeScript', 'React', 'Node.js', 'Next.js', 'PostgreSQL'],
    preferred_work_models: ['Remoto'],
  });

  const context = repo.getCandidateContext(createdUser.id);
  if (!context || context.skills.length !== 5) {
    throw new Error('Falha ao consolidar contexto do candidato!');
  }
  console.log('   ✅ Contexto do candidato consolidado com sucesso:', context.skills);

  const recommended = repo.getRecommendedJobs(createdUser.id, { limit: 10 });
  console.log(`   ✅ Busca de vagas recomendadas retornou ${recommended.items.length} oportunidades.`);

  const stats = repo.getMatchStats(createdUser.id);
  console.log('   ✅ Estatísticas de Match calculadas:');
  console.log(`      - Vagas Analisadas: ${stats.totalAnalyzed}`);
  console.log(`      - Média de Score: ${stats.avgScore}%`);
  console.log(`      - Vagas Super Match (>=75%): ${stats.highMatchCount}`);
  console.log(`      - Top Skills Demandadas: ${stats.topMatchedSkills.map(s => s.skill).join(', ')}`);

  console.log('\n🎉 TODOS OS TESTES DA FASE 38 PASSARAM COM SUCESSO! 🚀');
}

runMatchTests().catch((err) => {
  console.error('❌ Erro durante os testes da Fase 38:', err);
  process.exit(1);
});
