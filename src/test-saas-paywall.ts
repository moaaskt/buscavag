import Database from 'better-sqlite3';
import path from 'path';
import { SAAS_PLANS, getTierLimits, canUserSaveMoreJobs } from './lib/saasLimits';
import { createSessionToken, verifySessionToken } from './lib/auth';
import { CandidateMatcher } from './services/candidateMatcher';

const dbPath = path.resolve(process.cwd(), 'buscavag.db');
const db = new Database(dbPath);
const matcher = new CandidateMatcher();

async function runTests() {
  console.log('🚀 Iniciando bateria de testes do SaaS & Paywall (Fase 39)...\n');

  // Teste 1: Configurações de Planos
  console.log('--- Teste 1: Validação das Configurações de Planos SaaS ---');
  const freeConfig = getTierLimits('free');
  const premiumConfig = getTierLimits('premium');
  
  if (freeConfig.maxSavedJobs !== 5) {
    throw new Error(`Erro: Free maxSavedJobs esperado 5, obtido ${freeConfig.maxSavedJobs}`);
  }
  if (freeConfig.maxRecommendedJobsUnlocked !== 5) {
    throw new Error(`Erro: Free maxRecommendedJobsUnlocked esperado 5, obtido ${freeConfig.maxRecommendedJobsUnlocked}`);
  }
  if (premiumConfig.maxSavedJobs !== Infinity) {
    throw new Error(`Erro: Premium maxSavedJobs esperado Infinity, obtido ${premiumConfig.maxSavedJobs}`);
  }
  if (freeConfig.unlimitedAiCvAnalysis !== false) {
    throw new Error(`Erro: Free não deve ter unlimitedAiCvAnalysis`);
  }
  if (premiumConfig.unlimitedAiCvAnalysis !== true) {
    throw new Error(`Erro: Premium deve ter unlimitedAiCvAnalysis`);
  }
  console.log('✅ Configurações e limites de planos validados com sucesso!');

  // Setup de Usuário de Teste
  console.log('\n--- Setup: Criando Usuário de Teste ---');
  const testEmail = `saas_test_${Date.now()}@buscavag.com`;
  const testUserId = `user_saas_${Date.now()}`;
  
  db.prepare(`
    INSERT INTO users (id, name, email, password_hash, tier, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'free', datetime('now'), datetime('now'))
  `).run(testUserId, 'Candidato SaaS Teste', testEmail, 'hash123');

  // Adiciona perfil para garantir recomendações
  db.prepare(`
    INSERT INTO candidate_profiles (user_id, target_role, seniority, skills, preferred_work_models, updated_at)
    VALUES (?, 'Desenvolvedor Frontend', 'Pleno', '["React", "TypeScript", "Node.js", "Tailwind"]', '["Remoto"]', datetime('now'))
  `).run(testUserId);

  // Teste 2: Limite de Vagas Salvas no Free (Máximo 5)
  console.log('\n--- Teste 2: Limite de Vagas Salvas no Plano Free ---');
  // Busca 10 vagas do banco
  const sampleJobs = db.prepare(`SELECT * FROM jobs LIMIT 10`).all() as any[];
  if (sampleJobs.length < 6) {
    throw new Error('Não há vagas suficientes no banco para o teste.');
  }

  // Salva 5 vagas no Free
  for (let i = 0; i < 5; i++) {
    const check = canUserSaveMoreJobs(i, 'free');
    if (!check.allowed) {
      throw new Error(`Erro: Deveria permitir salvar a vaga ${i + 1} no plano Free.`);
    }
    db.prepare(`
      INSERT INTO user_saved_jobs (user_id, job_id, status, created_at)
      VALUES (?, ?, 'saved', datetime('now'))
    `).run(testUserId, sampleJobs[i].id);
  }

  const savedCountFree = db.prepare(`SELECT COUNT(*) as count FROM user_saved_jobs WHERE user_id = ?`).get(testUserId) as { count: number };
  console.log(`Vagas salvas no plano Free: ${savedCountFree.count}/5`);

  // Tenta salvar a 6ª vaga
  const checkSixth = canUserSaveMoreJobs(savedCountFree.count, 'free');
  if (checkSixth.allowed) {
    throw new Error('Erro: Não deveria permitir salvar a 6ª vaga no plano Free!');
  }
  console.log('✅ Limite de 5 vagas salvas no plano Free bloqueou a 6ª vaga com sucesso!');

  // Teste 3: Paywall nas Vagas Recomendadas
  console.log('\n--- Teste 3: Regra de Paywall nas Vagas Recomendadas (Free vs Pro) ---');
  const userRowFree = db.prepare(`SELECT * FROM users WHERE id = ?`).get(testUserId) as any;
  const profileRow = db.prepare(`SELECT * FROM candidate_profiles WHERE user_id = ?`).get(testUserId) as any;
  
  const rankedJobs = matcher.rankJobs(
    sampleJobs,
    {
      userId: testUserId,
      targetRole: profileRow.target_role,
      seniority: profileRow.seniority,
      skills: JSON.parse(profileRow.skills),
      preferredWorkModels: JSON.parse(profileRow.preferred_work_models),
    },
    { minScore: 0, limit: 10 }
  );

  const maxUnlockedFree = getTierLimits(userRowFree.tier).maxRecommendedJobsUnlocked;
  const processedMatchesFree = rankedJobs.map((item, index) => {
    const isLocked = maxUnlockedFree !== Infinity && index >= maxUnlockedFree;
    return {
      ...item,
      isLocked,
      job: {
        ...item.job,
        url: isLocked ? '#upgrade-required' : item.job.url,
      }
    };
  });

  const unlockedCount = processedMatchesFree.filter(m => !m.isLocked).length;
  const lockedCount = processedMatchesFree.filter(m => m.isLocked).length;
  console.log(`Recomendações no Free: ${unlockedCount} desbloqueadas, ${lockedCount} bloqueadas (com paywall)`);
  
  if (unlockedCount > 5) {
    throw new Error(`Erro: Mais de 5 vagas desbloqueadas no Free (${unlockedCount})`);
  }
  if (lockedCount > 0 && processedMatchesFree[5].job.url !== '#upgrade-required') {
    throw new Error('Erro: URL da vaga bloqueada não foi ocultada com paywall!');
  }
  console.log('✅ Paywall de recomendações no plano Free validado com sucesso!');

  // Teste 4: Upgrade para Plano Pro
  console.log('\n--- Teste 4: Simulação de Upgrade Instantâneo para Plano Pro ---');
  db.prepare(`UPDATE users SET tier = 'premium' WHERE id = ?`).run(testUserId);
  const userRowPremium = db.prepare(`SELECT * FROM users WHERE id = ?`).get(testUserId) as any;

  if (userRowPremium.tier !== 'premium') {
    throw new Error('Erro: Falha ao atualizar tier para premium');
  }

  // Gera token de sessão Pro e valida payload
  const proToken = createSessionToken({
    userId: userRowPremium.id,
    email: userRowPremium.email,
    name: userRowPremium.name,
    tier: userRowPremium.tier,
  });
  const decodedPro = verifySessionToken(proToken);
  if (decodedPro?.tier !== 'premium') {
    throw new Error('Erro: JWT Token não refletiu o tier premium');
  }
  console.log(`✅ Upgrade executado. Novo token emitido com tier '${decodedPro.tier}'`);

  // Teste 5: Validação de Permissões Desbloqueadas no Pro
  console.log('\n--- Teste 5: Validação das Regras com Usuário Pro ---');
  // Salva a 6ª vaga agora que é Pro
  const checkSixthPro = canUserSaveMoreJobs(5, 'premium');
  if (!checkSixthPro.allowed) {
    throw new Error('Erro: Usuário Pro deveria conseguir salvar mais de 5 vagas!');
  }
  db.prepare(`
    INSERT INTO user_saved_jobs (user_id, job_id, status, created_at)
    VALUES (?, ?, 'saved', datetime('now'))
  `).run(testUserId, sampleJobs[5].id);
  
  const savedCountPro = db.prepare(`SELECT COUNT(*) as count FROM user_saved_jobs WHERE user_id = ?`).get(testUserId) as { count: number };
  console.log(`Vagas salvas no plano Pro: ${savedCountPro.count}/Ilimitadas`);

  // Valida recomendações 100% desbloqueadas no Pro
  const maxUnlockedPro = getTierLimits(userRowPremium.tier).maxRecommendedJobsUnlocked;
  const processedMatchesPro = rankedJobs.map((item, index) => {
    const isLocked = maxUnlockedPro !== Infinity && index >= maxUnlockedPro;
    return {
      ...item,
      isLocked,
    };
  });
  const lockedCountPro = processedMatchesPro.filter(m => m.isLocked).length;
  if (lockedCountPro !== 0) {
    throw new Error(`Erro: Usuário Pro teve vagas bloqueadas (${lockedCountPro})`);
  }
  console.log('✅ Usuário Pro tem 100% das vagas recomendadas desbloqueadas e limite de salvas ilimitado!');

  // Teste 6: Downgrade / Cancelamento de Assinatura
  console.log('\n--- Teste 6: Downgrade / Cancelamento para Free ---');
  db.prepare(`UPDATE users SET tier = 'free' WHERE id = ?`).run(testUserId);
  const userRowDowngraded = db.prepare(`SELECT * FROM users WHERE id = ?`).get(testUserId) as any;
  if (userRowDowngraded.tier !== 'free') {
    throw new Error('Erro ao fazer downgrade para free');
  }
  console.log('✅ Downgrade para plano Free concluído com sucesso!');

  // Cleanup
  console.log('\n--- Limpeza de Dados de Teste ---');
  db.prepare(`DELETE FROM user_saved_jobs WHERE user_id = ?`).run(testUserId);
  db.prepare(`DELETE FROM candidate_profiles WHERE user_id = ?`).run(testUserId);
  db.prepare(`DELETE FROM users WHERE id = ?`).run(testUserId);
  console.log('✅ Limpeza concluída.');

  console.log('\n🎉 TODOS OS TESTES DO SAAS & PAYWALL (FASE 39) PASSARAM COM 100% DE SUCESSO!');
}

runTests().catch((err) => {
  console.error('\n❌ Erro durante a execução dos testes:', err);
  process.exit(1);
});
