import { CandidateRepository } from '@/db/candidateRepository';
import { db } from '@/db';

async function runPhase72Tests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO TESTES DA PHASE 72: UNIFICAÇÃO DE ONBOARDING');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, description: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] Teste ${totalTests}: ${description}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] Teste ${totalTests}: ${description}`);
    }
  }

  const repo = new CandidateRepository();
  const testUserId = 'test-phase72-' + Date.now();
  const testEmail = `user-${testUserId}@example.com`;

  try {
    // Setup do usuário de teste
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, tier, role, onboarding_completed, created_at, updated_at)
      VALUES (?, ?, 'hash123', 'Usuário Teste Phase 72', 'free', 'CANDIDATE', 0, datetime('now'), datetime('now'))
    `).run(testUserId, testEmail);

    // Teste 1: Usuário recém-criado sem perfil deve ter onboarding incompleto
    console.log('--- Teste 1: Usuário novo sem perfil ---');
    const userInitial = repo.getUserById(testUserId);
    assert(userInitial?.onboarding_completed === 0, 'onboarding_completed inicial deve ser 0');
    assert(repo.isOnboardingComplete(testUserId) === false, 'isOnboardingComplete deve retornar false para usuário sem perfil');

    // Teste 2: Preenchimento parcial (apenas cargo e senioridade, sem skills)
    console.log('\n--- Teste 2: Perfil parcial sem skills ---');
    repo.upsertProfile(testUserId, {
      target_role: 'Desenvolvedor Full Stack',
      seniority: 'Pleno',
      skills: [],
      primary_stack: [],
      secondary_stack: [],
    });
    const userAfterPartial = repo.getUserById(testUserId);
    assert(userAfterPartial?.onboarding_completed === 0, 'onboarding_completed deve permanecer 0 quando não há skills');
    assert(repo.isOnboardingComplete(testUserId) === false, 'isOnboardingComplete deve retornar false se não houver nenhuma skill');

    // Teste 3: Preenchimento completo do perfil profissional (com cargo, senioridade e skills)
    console.log('\n--- Teste 3: Perfil profissional completo via preenchimento manual ---');
    repo.upsertProfile(testUserId, {
      target_role: 'Desenvolvedor Frontend',
      seniority: 'Sênior',
      skills: ['TypeScript', 'React', 'Tailwind CSS'],
    });

    const userAfterFull = repo.getUserById(testUserId);
    assert(userAfterFull?.onboarding_completed === 1, 'upsertProfile com dados válidos deve marcar automaticamente onboarding_completed = 1');
    assert(repo.isOnboardingComplete(testUserId) === true, 'isOnboardingComplete deve retornar true para perfil completo');

    // Teste 4: Consulta de recomendações para perfil manual desbloqueado
    console.log('\n--- Teste 4: Acesso liberado ao motor de recomendação sem CV ---');
    const isCompleted = repo.isOnboardingComplete(testUserId);
    assert(isCompleted === true, 'Regra de onboarding unificada deve liberar acesso sem upload forçado de CV');

    const recommended = repo.getRecommendedJobs(testUserId, { limit: 5 });
    assert(Array.isArray(recommended.items), 'getRecommendedJobs deve retornar array de vagas para candidato habilitado');

    // Teste 5: Idempotência de isOnboardingComplete
    console.log('\n--- Teste 5: Idempotência e consistência ---');
    assert(repo.isOnboardingComplete(testUserId) === true, 'isOnboardingComplete é idempotente e permanece true');
    const userFinal = repo.getUserById(testUserId);
    assert(userFinal?.onboarding_completed === 1, 'Banco de dados preserva onboarding_completed = 1');

  } finally {
    // Teardown dos dados de teste
    db.prepare('DELETE FROM candidate_profiles WHERE user_id = ?').run(testUserId);
    db.prepare('DELETE FROM users WHERE id = ?').run(testUserId);
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL DA SUÍTE PHASE 72: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runPhase72Tests().catch((err) => {
  console.error('Erro crítico ao executar suíte de testes da Phase 72:', err);
  process.exit(1);
});
