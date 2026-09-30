/**
 * test-phase75.ts — Suíte de testes da Phase 75
 * Resiliência de Payload e Sanitização na API de Perfil
 *
 * Execução: npx tsx src/test-phase75.ts
 */

import { profileSchema, VALID_UFS } from './app/api/candidate/profile/route';
import { CandidateRepository } from './db/candidateRepository';

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

// ─── Testes de Validação do Schema Zod (profileSchema) ─────────────────────────

console.log('\n🛡️ [Phase 75] Testes de Resiliência e Sanitização do profileSchema\n');

test('T01 — I-06 / REQ-04: Payload com state: "" (string vazia) normaliza para null', () => {
  const result = profileSchema.safeParse({
    target_role: 'Desenvolvedor Frontend',
    seniority: 'Pleno',
    state: '',
  });
  assert(result.success, 'schema deve aceitar string vazia');
  if (result.success) {
    assertEqual(result.data.state, null, 'state deve ser null');
  }
});

test('T02 — I-06 / REQ-04: Payload com state: "   " (apenas espaços) normaliza para null', () => {
  const result = profileSchema.safeParse({
    state: '   ',
  });
  assert(result.success, 'schema deve aceitar espaços');
  if (result.success) {
    assertEqual(result.data.state, null, 'state com espaços deve ser null');
  }
});

test('T03 — REQ-04: Payload com UF válida ("SC", "SP", "RJ") é aceito com sucesso', () => {
  for (const uf of ['SC', 'SP', 'RJ', 'PR', 'MG', 'RS']) {
    const result = profileSchema.safeParse({ state: uf });
    assert(result.success, `UF ${uf} deve ser aceita`);
    if (result.success) {
      assertEqual(result.data.state, uf, `state deve ser ${uf}`);
    }
  }
});

test('T04 — REQ-04: Payload com UF inválida ("ZZ", "AA", "12") é rejeitado', () => {
  const result1 = profileSchema.safeParse({ state: 'ZZ' });
  assertEqual(result1.success, false, 'ZZ deve falhar');

  const result2 = profileSchema.safeParse({ state: 'AA' });
  assertEqual(result2.success, false, 'AA deve falhar');

  const result3 = profileSchema.safeParse({ state: 'BRASIL' });
  assertEqual(result3.success, false, 'BRASIL deve falhar');
});

test('T05 — REQ-05: city com espaços nas bordas é higienizado com trim()', () => {
  const result = profileSchema.safeParse({
    city: '  Florianópolis  ',
  });
  assert(result.success, 'deve ser válido');
  if (result.success) {
    assertEqual(result.data.city, 'Florianópolis', 'city trim');
  }
});

test('T06 — REQ-05: city com apenas espaços "   " normaliza para null', () => {
  const result = profileSchema.safeParse({
    city: '     ',
  });
  assert(result.success, 'deve ser válido');
  if (result.success) {
    assertEqual(result.data.city, null, 'city vazio deve ser null');
  }
});

test('T07 — REQ-05: target_role e seniority com espaços são higienizados', () => {
  const result = profileSchema.safeParse({
    target_role: '  Engenheiro de Software  ',
    seniority: '  Sênior  ',
  });
  assert(result.success, 'deve ser válido');
  if (result.success) {
    assertEqual(result.data.target_role, 'Engenheiro de Software', 'target_role trim');
    assertEqual(result.data.seniority, 'Sênior', 'seniority trim');
  }
});

test('T08 — REQ-05: target_role e seniority preenchidos apenas com espaços convertem para null', () => {
  const result = profileSchema.safeParse({
    target_role: '   ',
    seniority: '   ',
  });
  assert(result.success, 'deve ser válido');
  if (result.success) {
    assertEqual(result.data.target_role, null, 'target_role null');
    assertEqual(result.data.seniority, null, 'seniority null');
  }
});

test('T09 — REQ-05: expected_salary e bio são higienizados com trim()', () => {
  const result = profileSchema.safeParse({
    expected_salary: '  6500  ',
    bio: '  Desenvolvedor Full Stack apaixonado por TypeScript e React.  ',
  });
  assert(result.success, 'deve ser válido');
  if (result.success) {
    assertEqual(result.data.expected_salary, '6500', 'expected_salary trim');
    assertEqual(result.data.bio, 'Desenvolvedor Full Stack apaixonado por TypeScript e React.', 'bio trim');
  }
});

// ─── Testes Integrados com CandidateRepository ───────────────────────────────

console.log('\n🗄️ [Phase 75] Testes de Persistência e Integração com Repositório\n');

test('T10 — REQ-06: Persistência no CandidateRepository com dados sanitizados pelo schema', () => {
  const repo = new CandidateRepository();
  const testUserId = `test-phase75-${Date.now()}`;

  repo.createUser({
    id: testUserId,
    email: `phase75-${Date.now()}@buscavag.test`,
    password_hash: 'hash123',
    name: 'Candidato Phase 75',
  });

  const rawInput = {
    target_role: '  Tech Lead  ',
    seniority: '  Sênior  ',
    expected_salary: ' 15000 ',
    skills: ['TypeScript', 'Go', 'Docker'],
    preferred_work_models: ['Remoto', 'Híbrido'],
    bio: '  Liderança técnica e arquitetura resiliente.  ',
    city: '  Curitiba  ',
    state: '  ', // Espaços vazios ➔ deve virar null
  };

  const parsed = profileSchema.parse(rawInput);
  const updated = repo.upsertProfile(testUserId, parsed);

  assertEqual(updated.target_role, 'Tech Lead', 'target_role persistido sem espaços');
  assertEqual(updated.seniority, 'Sênior', 'seniority persistido sem espaços');
  assertEqual(updated.expected_salary, '15000', 'expected_salary persistido sem espaços');
  assertEqual(updated.city, 'Curitiba', 'city persistida sem espaços');
  assertEqual(updated.state, null, 'state vazio persistido como null');
  assertEqual(updated.bio, 'Liderança técnica e arquitetura resiliente.', 'bio persistida sem espaços');

  // Verifica se o onboarding foi concluído
  const isOnboardingDone = repo.isOnboardingComplete(testUserId);
  assertEqual(isOnboardingDone, true, 'onboarding deve ser concluído');
});

// ─── Resultado Final ──────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`📊 Resultado: ${passed} aprovados, ${failed} reprovados (total: ${passed + failed})`);

if (failed > 0) {
  console.error(`\n❌ ${failed} teste(s) falharam.`);
  process.exit(1);
} else {
  console.log(`\n✅ Todos os ${passed} testes da Phase 75 aprovados com 100% de sucesso!`);
  process.exit(0);
}
