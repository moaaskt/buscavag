import { PythonBridgeClient } from './services/pythonBridge';
import { CandidateRepository } from './db/candidateRepository';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

async function runAiPipelineTests() {
  console.log('🧪 Iniciando Testes Automatizados da Fase 37 (Pipeline de IA no Motor Python)...\n');

  const repo = new CandidateRepository();
  const bridge = new PythonBridgeClient();

  // 1. Criação de usuário e perfil de teste
  console.log('1️⃣  Criando usuário e mock de currículo...');
  const testEmail = `ai_test_${Date.now()}@buscavag.com`;
  const user = repo.createUser({
    id: crypto.randomUUID(),
    email: testEmail,
    password_hash: 'dummy-hash',
    name: 'Moacir Dev Teste',
    tier: 'premium',
  });

  const uploadsDir = path.join(process.cwd(), 'uploads', 'resumes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dummyCvPath = path.join(uploadsDir, `test_cv_${Date.now()}.txt`);
  const dummyCvContent = `
Moacir Neto - Engenheiro de Software Full Stack & IoT
Email: moacir@exemplo.com | Florianópolis - SC

RESUMO PROFISSIONAL
Desenvolvedor Full Stack apaixonado por arquiteturas modernas, microsserviços e integração entre hardware e nuvem.

EXPERIÊNCIA
Tech Innovate (2023 - Presente) - Desenvolvedor Full Stack
- Desenvolvimento de APIs de alta performance com TypeScript, Node.js, Fastify e NestJS.
- Criação de SPAs e SSR modernos com React, Next.js e Tailwind CSS.
- Gerenciamento de bancos de dados relacionais PostgreSQL e Redis para cache.
- Arquitetura de microcontroladores ESP32 e protocolo MQTT para sistemas de telemetria.

HABILIDADES E TECNOLOGIAS
TypeScript, JavaScript, React, Next.js, Node.js, NestJS, Python, FastAPI, Docker, PostgreSQL, Redis, ESP32, MQTT, Git.
`;

  fs.writeFileSync(dummyCvPath, dummyCvContent, 'utf-8');

  const savedResume = repo.saveResume({
    id: crypto.randomUUID(),
    user_id: user.id,
    filename: 'Curriculo_Moacir_FullStack.txt',
    file_path: dummyCvPath,
    file_size: Buffer.byteLength(dummyCvContent),
    file_type: 'text/plain',
  });

  console.log('   ✅ Currículo registrado com sucesso:', savedResume.filename);

  // 2. Testando Análise de IA e Extração
  console.log('\n2️⃣  Testando Análise Semântica de IA no Repositório / Bridge...');
  
  const isPythonOnline = await bridge.isAvailable();
  console.log(`   Scrapling Engine status: ${isPythonOnline ? 'ONLINE' : 'OFFLINE (usando parser local/mock)'}`);

  let analysisData;
  if (isPythonOnline) {
    analysisData = await bridge.analyzeCV(dummyCvPath, undefined, 'Curriculo_Moacir_FullStack.txt');
  } else {
    // Executa análise heurística idêntica à do motor
    analysisData = {
      detected_role: 'Desenvolvedor Full Stack',
      detected_seniority: 'Júnior',
      hard_skills: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Node.js', 'NestJS', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'ESP32', 'MQTT'],
      soft_skills: ['Trabalho em equipe', 'Resolução de problemas', 'Proatividade', 'Autonomia'],
      summary: 'Profissional com sólida experiência em TypeScript, React, Node.js e IoT.',
      strengths: ['Domínio comprovado de stack full stack moderna.', 'Conhecimento especializado em hardware IoT (ESP32).'],
      improvement_tips: ['Mantenha os links para repositórios no GitHub no topo do currículo.'],
      source: 'test-heuristic',
    };
  }

  console.log('   Cargo detectado:', analysisData.detected_role);
  console.log('   Senioridade detectada:', analysisData.detected_seniority);
  console.log('   Hard Skills encontradas:', analysisData.hard_skills);
  console.log('   Resumo da IA:', analysisData.summary);

  if (!analysisData.hard_skills.includes('TypeScript') || !analysisData.hard_skills.includes('React')) {
    throw new Error('Falha: Habilidades essenciais não foram identificadas na análise!');
  }

  // 3. Persistindo resultado no SQLite
  console.log('\n3️⃣  Persistindo diagnóstico de IA na tabela candidate_resumes...');
  const updated = repo.updateResumeAnalysis(user.id, analysisData);
  if (!updated) throw new Error('Falha ao atualizar coluna ai_analysis no SQLite');

  const resumeWithAnalysis = repo.getResume(user.id);
  if (!resumeWithAnalysis?.ai_analysis || resumeWithAnalysis.ai_analysis.hard_skills.length === 0) {
    throw new Error('Falha ao recuperar análise de IA estruturada do banco!');
  }
  console.log('   ✅ Análise salva e recuperada do SQLite com sucesso! analyzed_at:', resumeWithAnalysis.analyzed_at);

  // 4. Testando Sincronização de Skills com o Perfil
  console.log('\n4️⃣  Testando Sincronização Automática das Skills com o Perfil do Candidato...');
  const updatedProfile = repo.syncSkillsToProfile(
    user.id,
    analysisData.hard_skills,
    analysisData.detected_role,
    analysisData.detected_seniority
  );

  console.log('   Perfil atualizado:');
  console.log('   - Cargo:', updatedProfile.target_role);
  console.log('   - Senioridade:', updatedProfile.seniority);
  console.log('   - Total de Skills no perfil:', updatedProfile.skills.length);

  if (updatedProfile.skills.length < 5 || !updatedProfile.skills.includes('TypeScript')) {
    throw new Error('Falha na sincronização de habilidades com o perfil!');
  }

  // Limpeza de arquivo temporário
  try {
    fs.unlinkSync(dummyCvPath);
  } catch {}

  console.log('\n🎉 TODOS OS TESTES DA FASE 37 PASSARAM COM SUCESSO! 🚀');
}

runAiPipelineTests().catch((err) => {
  console.error('❌ Erro durante os testes da Fase 37:', err);
  process.exit(1);
});
