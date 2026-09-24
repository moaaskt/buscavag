/**
 * test-phase73.ts — Suíte de testes da Phase 73
 * Filtro Geográfico de Localização & Hard Constraint Presencial/Híbrido
 *
 * Execução: npx tsx src/test-phase73.ts
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

// ─── Testes da função pura evaluateGeographicCompatibility ────────────────────

console.log('\n🌍 [Phase 73] Testes de evaluateGeographicCompatibility()\n');

test('T01 — Vaga remota: sem penalidade geográfica (candidato com cidade)', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'Remote — trabalho 100% remoto',
    'Remoto',
    ['Remoto']
  );
  assertEqual(result.locationCap, 100, 'locationCap');
  assertEqual(result.isGeoHardBlocked, false, 'isGeoHardBlocked');
  assertEqual(result.locationScore, 100, 'locationScore');
});

test('T02 — Candidato SEM cidade + vaga presencial: score neutro 70', () => {
  const result = evaluateGeographicCompatibility(
    null, null,
    'São Paulo, SP',
    'Presencial',
    ['Presencial', 'Híbrido']
  );
  assertEqual(result.locationScore, 70, 'locationScore neutro');
  assertEqual(result.locationCap, 100, 'sem teto');
  assertEqual(result.isGeoHardBlocked, false, 'não bloqueado');
});

test('T03 — Mesma cidade: score 100, sem teto', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'Florianópolis, SC — Presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 100, 'locationScore');
  assertEqual(result.locationCap, 100, 'locationCap');
  assertEqual(result.isGeoHardBlocked, false, 'não bloqueado');
});

test('T04 — Mesmo estado, cidades diferentes: score 55, teto 70', () => {
  const result = evaluateGeographicCompatibility(
    'Joinville', 'SC',
    'Florianópolis - SC — Presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 55, 'locationScore');
  assertEqual(result.locationCap, 70, 'teto 70%');
  assertEqual(result.isGeoHardBlocked, false, 'não é hard block');
});

test('T05 — Estado diferente + candidato aceita presencial: Hard Block (teto 35)', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'São Paulo, SP — Presencial',
    'Presencial',
    ['Presencial', 'Híbrido']
  );
  assertEqual(result.locationScore, 15, 'locationScore');
  assertEqual(result.locationCap, 35, 'teto 35%');
  assertEqual(result.isGeoHardBlocked, true, 'Hard Block ativado');
  assert(result.geoReason.includes('Hard Block'), 'mensagem de hard block');
});

test('T06 — Candidato só aceita Remoto + vaga presencial: Hard Block legado (comportamento preservado)', () => {
  const result = evaluateGeographicCompatibility(
    'Florianópolis', 'SC',
    'São Paulo, SP',
    'Presencial',
    ['Remoto']
  );
  assertEqual(result.locationCap, 35, 'teto 35%');
  assertEqual(result.isGeoHardBlocked, true, 'Hard Block legado');
});

test('T07 — Vaga híbrida + estado diferente: Hard Block geográfico', () => {
  const result = evaluateGeographicCompatibility(
    'Belo Horizonte', 'MG',
    'Curitiba, PR — Híbrido 2x/semana',
    'Híbrido',
    ['Híbrido', 'Remoto']
  );
  assertEqual(result.locationCap, 35, 'teto 35%');
  assertEqual(result.isGeoHardBlocked, true, 'Hard Block geográfico');
});

test('T08 — Normalização de acentos: "São Paulo" == "sao paulo" na string da vaga', () => {
  const result = evaluateGeographicCompatibility(
    'São Paulo', 'SP',
    'sao paulo, SP - presencial',
    'Presencial',
    ['Presencial']
  );
  assertEqual(result.locationScore, 100, 'match por normalização sem acento');
  assertEqual(result.isGeoHardBlocked, false, 'não bloqueado');
});

// ─── Testes integrados: calculateMatch() com CandidateMatcher ────────────────

console.log('\n🎯 [Phase 73] Testes integrados via CandidateMatcher.calculateMatch()\n');

const matcher = new CandidateMatcher();

const baseCandidate: CandidateContext = {
  userId: 'test-geo-73',
  targetRole: 'Desenvolvedor Full Stack',
  seniority: 'Pleno',
  skills: ['React', 'TypeScript', 'Node.js'],
  preferredWorkModels: ['Presencial', 'Híbrido'],
  city: 'Florianópolis',
  state: 'SC',
};

test('T09 — Vaga remota + candidato prefere remoto: locationScore alto, sem hard block', () => {
  const candidateRemote: CandidateContext = {
    ...baseCandidate,
    preferredWorkModels: ['Remoto'],
    city: 'Florianópolis',
    state: 'SC',
  };
  const job = {
    id: 'job-remote-01',
    title: 'Desenvolvedor Full Stack',
    description: 'Vaga 100% remota para todo Brasil. React, TypeScript, Node.js.',
    location: 'Remoto — Brasil',
    work_model: 'Remoto',
  };
  const result = matcher.calculateMatch(job, candidateRemote);
  assertEqual(Boolean(result.isHardBlocked), false, 'sem hard block');
  assert(result.locationScore >= 90, `locationScore deve ser >= 90, foi ${result.locationScore}`);
});

test('T10 — Vaga presencial SP + candidato Florianópolis/SC: Hard Block geográfico', () => {
  const job = {
    id: 'job-sp-presencial',
    title: 'Desenvolvedor Full Stack Pleno',
    description: 'Oportunidade presencial na capital paulista. React, TypeScript.',
    location: 'São Paulo, SP',
    work_model: 'Presencial',
  };
  const result = matcher.calculateMatch(job, baseCandidate);
  assertEqual(Boolean(result.isHardBlocked), true, 'Hard Block ativo');
  assert(result.overallScore <= 35, `overallScore deve ser <= 35, foi ${result.overallScore}`);
  assert(result.blockReason != null && result.blockReason.includes('Hard Block'), 'blockReason com mensagem de hard block');
});

// ─── Resultado Final ──────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

if (failed > 0) {
  console.error(`\n❌ ${failed} teste(s) falharam. Verifique os erros acima.`);
  process.exit(1);
} else {
  console.log(`\n✅ Todos os ${passed} testes da Phase 73 aprovados!`);
  process.exit(0);
}
