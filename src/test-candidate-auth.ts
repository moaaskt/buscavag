import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, UserSession } from './lib/auth';
import { CandidateRepository } from './db/candidateRepository';
import crypto from 'crypto';

async function runTests() {
  console.log('🧪 Iniciando Testes Automatizados da Fase 36 (Autenticação e Painel do Candidato)...\n');

  // 1. Teste de Hashing e Verificação de Senhas
  console.log('1️⃣  Testando Hashing de Senha (scrypt + salt)...');
  const password = 'MinhaSenhaSegura123!';
  const hash = hashPassword(password);
  console.log('   Hash gerado:', hash);

  const isValid = verifyPassword(password, hash);
  const isInvalid = verifyPassword('SenhaErrada123', hash);

  if (!isValid || isInvalid) {
    throw new Error('Falha na validação de hash scrypt!');
  }
  console.log('   ✅ Verificação de senha aprovada com sucesso!\n');

  // 2. Teste de Tokens de Sessão JWT/HMAC
  console.log('2️⃣  Testando Tokens de Sessão HMAC-SHA256...');
  const testSession: UserSession = {
    userId: 'test-user-uuid-1234',
    email: 'candidato.teste@exemplo.com',
    name: 'Candidato de Teste',
    tier: 'free',
    role: 'CANDIDATE',
  };

  const token = createSessionToken(testSession);
  console.log('   Token gerado:', token.substring(0, 30) + '...');

  const verified = verifySessionToken(token);
  if (!verified || verified.userId !== testSession.userId || verified.email !== testSession.email) {
    throw new Error('Falha na validação do token assinado!');
  }
  console.log('   ✅ Token verificado com integridade e assinatura válidas!\n');

  // 3. Teste de Repositório do Candidato (SQLite)
  console.log('3️⃣  Testando Repositório CandidateRepository no SQLite...');
  const repo = new CandidateRepository();

  const testEmail = `teste_${Date.now()}@buscavag.com`;
  const createdUser = repo.createUser({
    id: crypto.randomUUID(),
    email: testEmail,
    password_hash: hash,
    name: 'Dev Candidato Teste',
    tier: 'free',
  });
  console.log('   Usuário criado no banco:', createdUser.id, createdUser.email);

  const fetchedUser = repo.getUserByEmail(testEmail);
  if (!fetchedUser || fetchedUser.id !== createdUser.id) {
    throw new Error('Falha ao recuperar usuário por email!');
  }

  // 4. Teste de Perfil
  console.log('4️⃣  Testando CRUD de Perfil Profissional...');
  const updatedProfile = repo.upsertProfile(createdUser.id, {
    target_role: 'Desenvolvedor Full Stack React/Node',
    seniority: 'Pleno',
    expected_salary: '7.500',
    preferred_work_models: ['Remoto', 'Híbrido'],
    skills: ['React', 'TypeScript', 'Node.js', 'FastAPI', 'SQLite'],
    bio: 'Desenvolvedor focado em produtos escaláveis e IA.',
  });

  if (
    updatedProfile.target_role !== 'Desenvolvedor Full Stack React/Node' ||
    updatedProfile.skills.length !== 5 ||
    !updatedProfile.preferred_work_models.includes('Remoto')
  ) {
    throw new Error('Falha ao atualizar dados de perfil!');
  }
  console.log('   ✅ Perfil salvo e recuperado com sucesso:', updatedProfile.target_role, updatedProfile.skills);

  // 5. Teste de Currículo
  console.log('\n5️⃣  Testando Metadados de Currículo...');
  const resume = repo.saveResume({
    id: crypto.randomUUID(),
    user_id: createdUser.id,
    filename: 'Curriculo_Dev_2026.pdf',
    file_path: '/uploads/resumes/dummy_test.pdf',
    file_size: 1024 * 350,
    file_type: 'application/pdf',
  });

  const fetchedResume = repo.getResume(createdUser.id);
  if (!fetchedResume || fetchedResume.filename !== 'Curriculo_Dev_2026.pdf') {
    throw new Error('Falha ao registrar e recuperar currículo!');
  }
  console.log('   ✅ Currículo salvo com sucesso:', fetchedResume.filename, `${fetchedResume.file_size} bytes`);

  // 6. Teste de Vagas Salvas (Toggle & List)
  console.log('\n6️⃣  Testando Salvamento de Vagas (Toggle)...');
  const dummyJobId = 'test-job-id-999';
  
  // Como precisamos de uma vaga no banco para o JOIN, vamos inserir uma vaga dummy caso não exista
  try {
    const { db } = await import('./db/index.js');
    db.prepare(`
      INSERT OR IGNORE INTO jobs (id, url, title, company, platform, description, published_at, location, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      dummyJobId,
      'https://techcorp.example/jobs/999',
      'Engenheiro de Software Sênior',
      'TechCorp',
      'Gupy',
      'Descrição da vaga de teste...',
      new Date().toISOString(),
      'Remoto, Brasil',
      new Date().toISOString()
    );
  } catch (err) {
    console.warn('Job insert note:', err);
  }

  const toggleRes1 = repo.toggleSavedJob(createdUser.id, dummyJobId, 'saved');
  console.log('   Toggle 1 (Salvar):', toggleRes1);
  if (!toggleRes1.isSaved) throw new Error('Deveria ter salvo a vaga!');

  const savedList = repo.getSavedJobs(createdUser.id);
  console.log('   Vagas salvas retornadas:', savedList.length);
  if (savedList.length !== 1 || savedList[0].job_id !== dummyJobId) {
    throw new Error('Falha ao listar vagas salvas!');
  }

  const toggleRes2 = repo.toggleSavedJob(createdUser.id, dummyJobId, 'saved');
  console.log('   Toggle 2 (Remover):', toggleRes2);
  if (toggleRes2.isSaved) throw new Error('Deveria ter removido a vaga!');

  const savedListAfter = repo.getSavedJobs(createdUser.id);
  if (savedListAfter.length !== 0) {
    throw new Error('Vaga ainda presente após remoção!');
  }
  console.log('   ✅ Sistema de vagas salvas e status validado com sucesso!\n');

  console.log('🎉 TODOS OS TESTES DA FASE 36 PASSARAM COM SUCESSO! 🚀');
}

runTests().catch((err) => {
  console.error('❌ Erro durante os testes:', err);
  process.exit(1);
});
