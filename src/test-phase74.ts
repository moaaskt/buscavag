/**
 * test-phase74.ts — Suíte de testes da Phase 74
 * Refinamento de Matching Geográfico (Cidades sem UF & Localizações Omissas)
 *
 * Execução: npx tsx src/test-phase74.ts
 */

import { evaluateGeographicCompatibility, CandidateMatcher, type CandidateContext } from './services/candidateMatcher';

// ─── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (err: any) {
    console.error(`  ❌ ${name}`);
    console.error(`     ${err.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: esperado ${JSON.stringify(expected)}, recebido ${JSON.stringify(actual)}`);
  }
}

// ─── Testes de evaluateGeographicCompatibility() ─────────────────────────────

console.log('\n🌍 [Phase 74] Testes de evaluateGeographicCompatibility()\n');

test('T01 — W-01.1: Vaga presencial com cidade "Florianópolis" (sem UF) dá match perfeito 100', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'Florianópolis — Presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 100, 'locationScore');
  assertEqual(result.locationCap, 100, 'locationCap');
  assertEqual(result.isGeoHardBlocked, false, 'isGeoHardBlocked');
  assert(result.geoReason.includes('mesma cidade'), 'motivo de mesma cidade');
});

test('T02 — W-01.1: Vaga presencial com cidade "Curitiba" (sem UF) dá match perfeito 100', () => {
  const result = evaluateGeographicCompatibility(
    'Curitiba', 'PR',
    'Curitiba - Centro',
    'Presencial',
    ['Presencial', 'Híbrido']
  );
  assertEqual(result.locationScore, 100, 'locationScore');
  assertEqual(result.locationCap, 100, 'locationCap');
  assertEqual(result.isGeoHardBlocked, false, 'isGeoHardBlocked');
});

test('T03 — W-01.1: Vaga presencial com cidade "São Paulo" (sem UF) dá match perfeito 100', () => {
  const result = evaluateGeographicCompatibility(
    'São Paulo', 'SP',
    'Vaga no escritório em São Paulo',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 100, 'locationScore');
  assertEqual(result.locationCap, 100, 'locationCap');
  assertEqual(result.isGeoHardBlocked, false, 'isGeoHardBlocked');
});

test('T04 — W-01.2: Vaga presencial com location vazia "" retorna score neutro 70', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    '',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 70, 'locationScore neutro');
  assertEqual(result.locationCap, 100, 'locationCap sem teto');
  assertEqual(result.isGeoHardBlocked, false, 'isGeoHardBlocked não bloqueado');
  assert(result.geoReason.includes('localização não informada'), 'motivo de localização não informada');
});

test('T05 — W-01.2: Vaga presencial com location null retorna score neutro 70', () => {
  const result = evaluateGeographicCompatibility(
    'Curitiba', 'PR',
    null,
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 70, 'locationScore neutro');
  assertEqual(result.locationCap, 100, 'locationCap sem teto');
  assertEqual(result.isGeoHardBlocked, false, 'isGeoHardBlocked');
});

test('T06 — W-01.2: Vaga presencial com location "Não informado" ou "A combinar" é neutra', () => {
  const result1 = evaluateGeographicCompatibility(
    'São Paulo', 'SP',
    'Não informado',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result1.locationScore, 70, 'locationScore neutro para Não informado');
  assertEqual(result1.isGeoHardBlocked, false, 'sem hard block');

  const result2 = evaluateGeographicCompatibility(
    'São Paulo', 'SP',
    'A combinar',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result2.locationScore, 70, 'locationScore neutro para A combinar');
  assertEqual(result2.isGeoHardBlocked, false, 'sem hard block');
});

test('T07 — W-01 Regressão: "Rio" (RJ) NÃO dá match em "Rio Grande do Sul, RS" (Hard Block preservado)', () => {
  const result = evaluateGeographicCompatibility(
    'Rio', 'RJ',
    'Rio Grande do Sul, RS — Presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.isGeoHardBlocked, true, 'deve ser Hard Block para RS');
  assertEqual(result.locationCap, 35, 'teto de 35%');
  assertEqual(result.locationScore, 15, 'score de estado divergente');
});

test('T08 — "Rio de Janeiro" (RJ) em vaga "Rio de Janeiro" (sem UF) dá match perfeito 100', () => {
  const result = evaluateGeographicCompatibility(
    'Rio de Janeiro', 'RJ',
    'Rio de Janeiro — Presencial Barra',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 100, 'locationScore');
  assertEqual(result.isGeoHardBlocked, false, 'sem hard block');
});

test('T09 — Vaga presencial com UF conflitante explícita ("São Paulo, SP") para candidato de SC gera Hard Block', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'São Paulo, SP — Presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.isGeoHardBlocked, true, 'Hard Block ativo para estado divergente');
  assertEqual(result.locationCap, 35, 'teto 35%');
  assertEqual(result.locationScore, 15, 'score 15');
});

test('T10 — Mesmo estado ("Florianópolis - SC") para candidato de Joinville/SC dá score 55 e teto 70', () => {
  const result = evaluateGeographicCompatibility(
    'Joinville', 'SC',
    'Florianópolis - SC — Presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 55, 'score 55');
  assertEqual(result.locationCap, 70, 'teto 70');
  assertEqual(result.isGeoHardBlocked, false, 'não é hard block');
});

test('T11 — Vaga remota com título "Home Office" ou "Remoto" mantém score 100 sem teto', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'São Paulo, SP',
    'Presencial',
    ['Remoto'],
    'Desenvolvedor Backend — Home Office'
  );
  assertEqual(result.isGeoHardBlocked, false, 'sem hard block para vaga com título Home Office');
  assertEqual(result.locationCap, 100, 'sem teto');
  assertEqual(result.locationScore, 100, 'score 100 para preferência Remoto');
});

// ─── Testes Integrados via CandidateMatcher.calculateMatch() ─────────────────

console.log('\n🎯 [Phase 74] Testes Integrados via CandidateMatcher.calculateMatch()\n');

const matcher = new CandidateMatcher();

const candidateFloripa: CandidateContext = {
  userId: 'test-cand-floripa',
  targetRole: 'Desenvolvedor Full Stack',
  seniority: 'Pleno',
  skills: ['React', 'TypeScript', 'Node.js'],
  preferredWorkModels: ['Presencial', 'Híbrido'],
  city: 'Florianópolis',
  state: 'SC',
};

test('T12 — Integrado: Vaga presencial Florianópolis (sem UF) calcula match sem Hard Block e com score alto', () => {
  const job = {
    id: 'job-floripa-sem-uf',
    title: 'Desenvolvedor Full Stack Pleno',
    description: 'Atuação presencial em Florianópolis no polo tech. React, TypeScript, Node.js.',
    location: 'Florianópolis',
    work_model: 'Presencial',
  };
  const result = matcher.calculateMatch(job, candidateFloripa);
  assertEqual(Boolean(result.isHardBlocked), false, 'sem hard block');
  assertEqual(result.locationScore, 100, 'locationScore 100');
  assert(result.overallScore >= 80, `overallScore deve ser >= 80, foi ${result.overallScore}`);
});

test('T13 — Integrado: Vaga presencial com location vazia calcula match neutro sem Hard Block', () => {
  const job = {
    id: 'job-sem-loc',
    title: 'Desenvolvedor Full Stack Pleno',
    description: 'Oportunidade presencial. React, TypeScript, Node.js.',
    location: '',
    work_model: 'Presencial',
  };
  const result = matcher.calculateMatch(job, candidateFloripa);
  assertEqual(Boolean(result.isHardBlocked), false, 'sem hard block para vaga sem location');
  assertEqual(result.locationScore, 70, 'locationScore neutro 70');
  assert(result.overallScore >= 70, `overallScore deve ser >= 70, foi ${result.overallScore}`);
});

// ─── Resultado Final ──────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

if (failed > 0) {
  console.error(`\n❌ ${failed} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log(`\n✅ Todos os ${passed} testes da Phase 74 aprovados com 100% de sucesso!`);
  process.exit(0);
}
