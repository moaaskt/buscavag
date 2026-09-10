import { CandidateRepository } from './db/candidateRepository';
import { createSessionToken, verifySessionToken } from './lib/auth';

async function testRBAC() {
  console.log('🧪 Iniciando testes de RBAC (Role-Based Access Control)...\n');

  const repo = new CandidateRepository();

  // Cria um usuário CANDIDATE (Default)
  console.log('Criando usuário Candidate padrão...');
  const candidateEmail = 'candidate_rbac@test.com';
  let candidate = repo.getUserByEmail(candidateEmail);
  if (!candidate) {
    candidate = repo.createUser({
      id: 'usr_candidate_123',
      email: candidateEmail,
      password_hash: 'hash_test',
      name: 'Candidato Teste'
    });
  }
  console.log('Candidato criado/recuperado:', { id: candidate.id, email: candidate.email, role: candidate.role });

  // Cria um usuário ADMIN
  console.log('\nCriando usuário Admin...');
  const adminEmail = 'admin_rbac@test.com';
  let admin = repo.getUserByEmail(adminEmail);
  if (!admin) {
    admin = repo.createUser({
      id: 'usr_admin_456',
      email: adminEmail,
      password_hash: 'hash_test',
      name: 'Administrador Teste',
      role: 'ADMIN'
    });
  }
  console.log('Admin criado/recuperado:', { id: admin.id, email: admin.email, role: admin.role });

  // Teste de Tokens (Auth Library)
  console.log('\nTestando Geração e Verificação de Tokens...');
  
  const tokenCandidate = createSessionToken({
    userId: candidate.id,
    email: candidate.email,
    name: candidate.name,
    tier: candidate.tier,
    role: candidate.role
  });
  
  const tokenAdmin = createSessionToken({
    userId: admin.id,
    email: admin.email,
    name: admin.name,
    tier: admin.tier,
    role: admin.role
  });

  const verifiedCandidate = verifySessionToken(tokenCandidate);
  const verifiedAdmin = verifySessionToken(tokenAdmin);

  console.log('Candidato Sessão Role:', verifiedCandidate?.role);
  console.log('Admin Sessão Role:', verifiedAdmin?.role);

  if (verifiedCandidate?.role === 'CANDIDATE' && verifiedAdmin?.role === 'ADMIN') {
    console.log('\n✅ Teste RBAC concluído com sucesso!');
  } else {
    console.log('\n❌ Erro: Roles incorretas na verificação dos tokens.');
    process.exit(1);
  }
}

testRBAC().catch(console.error);
