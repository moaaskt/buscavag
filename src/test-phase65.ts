import {
  CandidateMatcher,
  CandidateContext,
  parseSalary,
  parseJobSeniority,
  evaluateSeniorityDistance,
} from './services/candidateMatcher.js';
import { HermesEvaluator } from './services/hermesEvaluator.js';
import { PlatformSource } from './types/job.js';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  }
}

async function runPhase65Tests() {
  console.log('🧪 ========================================================');
  console.log('  TESTES DE VALIDAÇÃO: FASE 65 - MOTOR DE MATCH ESTRITO');
  console.log('  Hard Constraints, Matriz de Senioridade & Normalizador Regex');
  console.log('========================================================\n');

  const matcher = new CandidateMatcher();

  // ==========================================
  // TESTE 1: NORMALIZADOR DE SALÁRIO COM SUFIXO "k"
  // ==========================================
  console.log('1️⃣  Testando Normalizador de Salário (parseSalary)...');

  const sal1 = parseSalary('R$ 8k - 12k');
  console.log('   "R$ 8k - 12k" ->', sal1);
  assert(sal1?.min === 8000 && sal1?.max === 12000, 'Deveria converter 8k e 12k para 8000 e 12000');

  const sal2 = parseSalary('8.5k');
  console.log('   "8.5k" ->', sal2);
  assert(sal2?.min === 8500 && sal2?.max === 8500, 'Deveria converter 8.5k para 8500');

  const sal3 = parseSalary('R$ 3.500,00 a R$ 5.000,00');
  console.log('   "R$ 3.500,00 a R$ 5.000,00" ->', sal3);
  assert(sal3?.min === 3500 && sal3?.max === 5000, 'Deveria tratar moeda formato BR (3500 e 5000)');

  const sal4 = parseSalary('A combinar');
  assert(sal4 === null, 'Salário "A combinar" deve retornar null');

  console.log('   ✅ Normalizador de salário aprovado com sucesso!\n');

  // ==========================================
  // TESTE 2: MAPEAMENTO DE SINÔNIMOS DE CARGO / SENIORIDADE
  // ==========================================
  console.log('2️⃣  Testando Mapeamento de Sinônimos de Cargo / Senioridade...');

  const testCasesSenior = ['Dev Sr Node', 'Engenheiro SR Fullstack', 'Senior Python Engineer', 'Especialista Java', 'Tech Lead Mobile', 'Staff Engineer', 'Principal Architect'];
  for (const title of testCasesSenior) {
    const res = parseJobSeniority(title);
    assert(res.hasSenior, `Deveria identificar nível Sênior no título "${title}"`);
  }

  const testCasesPleno = ['Desenvolvedor Pleno React', 'Dev PL TypeScript', 'Mid-level Developer', 'Analista Pleno'];
  for (const title of testCasesPleno) {
    const res = parseJobSeniority(title);
    assert(res.hasPleno, `Deveria identificar nível Pleno no título "${title}"`);
  }

  const testCasesJunior = ['Dev Junior Web', 'Programador Jr', 'Junior Frontend Developer', 'Entry Level Programmer', 'Assistente de Desenvolvimento'];
  for (const title of testCasesJunior) {
    const res = parseJobSeniority(title);
    assert(res.hasJunior, `Deveria identificar nível Júnior no título "${title}"`);
  }

  console.log('   ✅ Sinônimos de senioridade mapeados e isolados com sucesso!\n');

  // ==========================================
  // TESTE 3: MATRIZ GRANULAR DE DISTÂNCIA DE SENIORIDADE
  // ==========================================
  console.log('3️⃣  Testando Matriz Granular de Distância de Senioridade...');

  // 3.1 Grave (Hard Block — Teto 35%): Júnior -> Sênior/Lead
  const evalGrave = evaluateSeniorityDistance('Júnior', 'Tech Lead / Sênior Full Stack');
  console.log('   [Grave - Júnior -> Sênior/Lead]:', {
    score: evalGrave.seniorityScore,
    cap: evalGrave.maxScoreCap,
    hardBlocked: evalGrave.isHardBlocked,
  });
  assert(evalGrave.maxScoreCap === 35, 'Teto do Hard Block grave deve ser cravado em 35%');
  assert(evalGrave.isHardBlocked === true, 'Deve marcar isHardBlocked como true');

  // 3.2 Moderado (Soft Penalty — Teto 60%): Júnior -> Pleno
  const evalMod1 = evaluateSeniorityDistance('Júnior', 'Desenvolvedor Pleno React');
  console.log('   [Moderado - Júnior -> Pleno]:', {
    score: evalMod1.seniorityScore,
    cap: evalMod1.maxScoreCap,
  });
  assert(evalMod1.maxScoreCap === 60, 'Teto de Júnior para Pleno deve ser 60%');

  // 3.3 Moderado (Soft Penalty — Teto 60%): Pleno -> Sênior
  const evalMod2 = evaluateSeniorityDistance('Pleno', 'Senior Software Engineer');
  console.log('   [Moderado - Pleno -> Sênior]:', {
    score: evalMod2.seniorityScore,
    cap: evalMod2.maxScoreCap,
  });
  assert(evalMod2.maxScoreCap === 60, 'Teto de Pleno para Sênior deve ser 60%');

  // 3.4 Overqualification (Teto 65%): Sênior -> Júnior
  const evalOver = evaluateSeniorityDistance('Sênior', 'Desenvolvedor Júnior Frontend');
  console.log('   [Overqualification - Sênior -> Júnior]:', {
    score: evalOver.seniorityScore,
    cap: evalOver.maxScoreCap,
  });
  assert(evalOver.maxScoreCap === 65, 'Teto de Overqualification deve ser 65%');

  // 3.5 Harmonia Perfeita (Sem Penalização): Júnior -> Júnior
  const evalPerfect = evaluateSeniorityDistance('Júnior', 'Desenvolvedor Júnior');
  console.log('   [Harmonia Perfeita - Júnior -> Júnior]:', {
    score: evalPerfect.seniorityScore,
    cap: evalPerfect.maxScoreCap,
  });
  assert(evalPerfect.maxScoreCap === 100 && evalPerfect.seniorityScore === 100, 'Harmonia Perfeita deve permitir score até 100%');

  console.log('   ✅ Matriz de distância validada com todos os caps estratégicos!\n');

  // ==========================================
  // TESTE 4: HARD BLOCK NO CANDIDATE MATCHER (TETO 35%)
  // ==========================================
  console.log('4️⃣  Testando Hard Block no CandidateMatcher (Candidato Jr vs Vaga Sr com 100% Stack)...');

  const juniorCandidate: CandidateContext = {
    userId: 'candidate-jr',
    targetRole: 'Desenvolvedor Full Stack',
    seniority: 'Júnior',
    expectedSalary: '3k',
    preferredWorkModels: ['Remoto'],
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'Docker', 'Tailwind CSS'],
  };

  // Vaga Sênior que pede exatamente o que o candidato domina
  const seniorJob = {
    id: 'job-sr-1',
    title: 'Engenheiro de Software Sênior / Tech Lead',
    company: 'BigCorp',
    location: 'Remoto',
    description: 'Buscamos Tech Lead Sênior especialista em React, TypeScript, Node.js, Next.js, PostgreSQL e Docker.',
    salary: 'R$ 15k - 20k',
  };

  const matchSr = matcher.calculateMatch(seniorJob, juniorCandidate);
  console.log(`   Vaga: "${seniorJob.title}"`);
  console.log(`   -> Overall Score: ${matchSr.overallScore}%`);
  console.log(`   -> Stack Score: ${matchSr.stackScore}%`);
  console.log(`   -> Hard Blocked: ${matchSr.isHardBlocked}`);
  console.log(`   -> Strong Match: ${matchSr.isStrongMatch}`);
  console.log(`   -> Parecer: ${matchSr.matchReasoning}`);

  assert(matchSr.stackScore >= 90, 'Stack score deveria ser alto devido ao domínio das tecnologias');
  assert(matchSr.overallScore <= 35, `Overall score (${matchSr.overallScore}) DEVE ser <= 35% devido ao Hard Block!`);
  assert(matchSr.isHardBlocked === true, 'Deve conter a flag isHardBlocked = true');
  assert(matchSr.isStrongMatch === false, 'Vaga eliminada NUNCA pode ser Strong Match');

  console.log('   ✅ Hard Block garantiu que o score cravou em <= 35%!\n');

  // ==========================================
  // TESTE 5: SOFT PENALTY (JÚNIOR VS PLENO - TETO 60%)
  // ==========================================
  console.log('5️⃣  Testando Soft Penalty (Candidato Jr vs Vaga Pleno - Teto 60%)...');

  const plenoJob = {
    id: 'job-pl-1',
    title: 'Desenvolvedor Full Stack Pleno',
    company: 'MidStartup',
    location: 'Remoto',
    description: 'Buscamos Dev Pleno com React, TypeScript, Node.js e PostgreSQL.',
    salary: 'R$ 6k - 8k',
  };

  const matchPl = matcher.calculateMatch(plenoJob, juniorCandidate);
  console.log(`   Vaga: "${plenoJob.title}"`);
  console.log(`   -> Overall Score: ${matchPl.overallScore}%`);
  console.log(`   -> Strong Match: ${matchPl.isStrongMatch}`);

  assert(matchPl.overallScore <= 60, `Score de Pleno (${matchPl.overallScore}%) DEVE ser <= 60%`);
  assert(matchPl.isStrongMatch === false, 'Vaga com penalização moderada não pode ser Super Match');

  console.log('   ✅ Soft Penalty validado com sucesso (teto 60%)!\n');

  // ==========================================
  // TESTE 6: VAGA PERFEITA (JÚNIOR VS JÚNIOR - ALTA ADERÊNCIA)
  // ==========================================
  console.log('6️⃣  Testando Vaga em Harmonia Perfeita (Candidato Jr vs Vaga Jr)...');

  const juniorJob = {
    id: 'job-jr-1',
    title: 'Desenvolvedor Full Stack Júnior',
    company: 'CoolStartup',
    location: 'Remoto',
    description: 'Vaga Júnior para atuar com React, TypeScript, Node.js e PostgreSQL.',
    salary: 'R$ 3.5k - 4.5k',
  };

  const matchJr = matcher.calculateMatch(juniorJob, juniorCandidate);
  console.log(`   Vaga: "${juniorJob.title}"`);
  console.log(`   -> Overall Score: ${matchJr.overallScore}%`);
  console.log(`   -> Strong Match: ${matchJr.isStrongMatch}`);

  assert(matchJr.overallScore >= 75, `Vaga júnior aderente deve pontuar >= 75% (obteve ${matchJr.overallScore}%)`);
  assert(matchJr.isStrongMatch === true, 'Deve ser Strong Match');

  console.log('   ✅ Harmonia perfeita atingiu Super Match (>= 75%)!\n');

  // ==========================================
  // TESTE 7: FALLBACK HEURÍSTICO DO HERMES EVALUATOR (TETO 35%)
  // ==========================================
  console.log('7️⃣  Testando HermesEvaluator (Heurística de Ingestão com Teto 35%)...');

  const hermes = new HermesEvaluator();

  const hermesSrJob = {
    title: 'Tech Lead / Desenvolvedor Sênior TypeScript',
    company: 'Enterprise S.A.',
    location: 'Remoto',
    description: 'Vaga para Tech Lead com experiência sólida em Node.js, TypeScript e React.',
    url: 'https://exemplo.com/sr',
    platform: PlatformSource.LINKEDIN,
    publishedAt: new Date(),
  };

  const evalSr = hermes.evaluateHeuristic(hermesSrJob);
  console.log(`   Heurística Hermes [Vaga Sênior]: "${hermesSrJob.title}"`);
  console.log(`   -> Overall Score: ${evalSr.overallScore}%`);
  console.log(`   -> Seniority Score: ${evalSr.seniorityScore}%`);
  console.log(`   -> Aprovada para Jr: ${evalSr.isJuniorFullStack}`);
  console.log(`   -> Parecer: ${evalSr.reasoning}`);

  assert(evalSr.overallScore <= 35, `Heurística do Hermes DEVE cravar score <= 35% (obteve ${evalSr.overallScore}%)`);
  assert(evalSr.isJuniorFullStack === false, 'Vaga sênior jamais pode ser aprovada para Moacir Neto (Júnior)');

  // Testando presencial fora de Florianópolis
  const hermesPresentialSpJob = {
    title: 'Desenvolvedor Full Stack Júnior',
    company: 'SP Agency',
    location: 'São Paulo (Presencial)',
    description: 'Vaga presencial em São Paulo com React e Node.js.',
    url: 'https://exemplo.com/sp',
    platform: PlatformSource.GUPY,
    publishedAt: new Date(),
  };

  const evalSp = hermes.evaluateHeuristic(hermesPresentialSpJob);
  console.log(`\n   Heurística Hermes [Presencial fora de FLN]: "${hermesPresentialSpJob.title}"`);
  console.log(`   -> Overall Score: ${evalSp.overallScore}%`);
  console.log(`   -> Location Score: ${evalSp.locationScore}%`);
  console.log(`   -> Aprovada: ${evalSp.isJuniorFullStack}`);

  assert(evalSp.overallScore <= 35, 'Presencial fora da Grande Florianópolis deve ter teto cravado em 35%');
  assert(evalSp.isJuniorFullStack === false, 'Presencial fora de Florianópolis deve ser reprovado');

  console.log('\n🎉 TODOS OS TESTES DA FASE 65 PASSARAM COM 100% DE SUCESSO! 🚀');
}

runPhase65Tests().catch((err) => {
  console.error('\n❌ Erro durante a execução dos testes da Fase 65:', err);
  process.exit(1);
});
