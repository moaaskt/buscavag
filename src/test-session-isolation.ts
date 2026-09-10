/**
 * Automated Test: Session Isolation & Guest State Protection (Phase 40)
 */

import { GET as getAuthMe } from '@/app/api/auth/me/route';
import { GET as getProfile } from '@/app/api/candidate/profile/route';
import { GET as getRecommendedJobs } from '@/app/api/candidate/recommended-jobs/route';
import { GET as getSavedJobs } from '@/app/api/candidate/saved-jobs/route';
import { NextRequest } from 'next/server';

async function runSessionIsolationTests() {
  console.log('🧪 Iniciando Testes de Isolamento de Sessão & Estado Zero (GUEST)...');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
    }
  }

  // 1. Test /api/auth/me for unauthenticated visitor
  try {
    const req = new NextRequest('http://localhost:3000/api/auth/me');
    const res = await getAuthMe(req);
    const json = await res.json();
    assert(res.status === 200, 'GET /api/auth/me responde status 200');
    assert(json.authenticated === false, 'Visitante anônimo retorna authenticated: false');
    assert(json.user === undefined || json.user === null, 'Nenhum dado de usuário retornado para visitante');
  } catch (err) {
    console.error('Erro no teste 1:', err);
    assert(false, 'GET /api/auth/me não deve lançar exceção');
  }

  // 2. Test /api/candidate/profile for unauthenticated visitor
  try {
    const req = new NextRequest('http://localhost:3000/api/candidate/profile');
    const res = await getProfile(req);
    const json = await res.json();
    assert(res.status === 401, 'GET /api/candidate/profile rejeita com 401 Unauthorized');
    assert(json.error !== undefined, 'Mensagem de erro de autenticação retornada');
  } catch (err) {
    console.error('Erro no teste 2:', err);
    assert(false, 'GET /api/candidate/profile guard test');
  }

  // 3. Test /api/candidate/recommended-jobs for unauthenticated visitor
  try {
    const req = new NextRequest('http://localhost:3000/api/candidate/recommended-jobs');
    const res = await getRecommendedJobs(req);
    const json = await res.json();
    assert(res.status === 401, 'GET /api/candidate/recommended-jobs rejeita com 401 Unauthorized');
    assert(json.success === false, 'success: false retornado');
  } catch (err) {
    console.error('Erro no teste 3:', err);
    assert(false, 'GET /api/candidate/recommended-jobs guard test');
  }

  // 4. Test /api/candidate/saved-jobs for unauthenticated visitor
  try {
    const req = new NextRequest('http://localhost:3000/api/candidate/saved-jobs');
    const res = await getSavedJobs(req);
    const json = await res.json();
    assert(res.status === 401, 'GET /api/candidate/saved-jobs rejeita com 401 Unauthorized');
  } catch (err) {
    console.error('Erro no teste 4:', err);
    assert(false, 'GET /api/candidate/saved-jobs guard test');
  }

  console.log(`\n📊 Resultado dos Testes: ${passed}/${total} assertions passaram.`);
  if (passed === total) {
    console.log('🎉 Todos os testes de isolamento de sessão e proteção GUEST passaram com sucesso!\n');
  } else {
    process.exit(1);
  }
}

runSessionIsolationTests().catch((e) => {
  console.error('Falha fatal na execução dos testes:', e);
  process.exit(1);
});
