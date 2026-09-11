import dotenv from 'dotenv';
import { JobRepository } from './db/repository';
import { PlatformSource, RawJob } from './types/job';
import { EvaluationResult } from './services/hermesEvaluator';

dotenv.config();

async function testPhase8() {
  console.log(`\n======================================================`);
  console.log(`  BUSCAVAG - TESTE FASE 8: WEB DASHBOARD & INTERACTIVE JOB BOARD`);
  console.log(`  Executado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`======================================================\n`);

  const repo = new JobRepository();
  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, message: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Falha no teste: ${message}`);
    }
  }

  console.log('--- 1. Testando Inserção e Gestão de Status Kanban no Banco ---');

  const testJob: RawJob = {
    title: 'Engenheiro Full Stack React/Node Teste Fase 8',
    company: 'NextCorp Dashboard',
    platform: PlatformSource.GLASSDOOR,
    url: 'https://glassdoor.com.br/job/test-phase8-kanban',
    description: 'Vaga de teste para verificar Kanban, Dashboard e API routes.',
    publishedAt: new Date(),
    location: 'Remoto',
  };

  const evalResult: EvaluationResult = {
    isJuniorFullStack: true,
    overallScore: 92,
    score: 92,
    stackScore: 95,
    seniorityScore: 90,
    locationScore: 100,
    category: 'Full Stack',
    gaps: ['AWS'],
    resumeTips: 'Destaque seus projetos fullstack.',
    reasoning: 'Excelente aderência técnica.',
  };

  const inserted = repo.insert(testJob, evalResult);
  assert(inserted.applicationStatus === 'pending', 'Status inicial deve ser "pending" (Inbox)');

  // Atualizar para 'applied'
  const updatedToApplied = repo.updateApplicationStatus(inserted.id, 'applied');
  assert(updatedToApplied === true, 'Deve atualizar status para "applied"');
  let fetched = repo.getJobById(inserted.id);
  assert(fetched?.applicationStatus === 'applied', 'Status recuperado deve ser "applied"');

  // Atualizar para 'interview'
  repo.updateApplicationStatus(inserted.id, 'interview');
  fetched = repo.getJobById(inserted.id);
  assert(fetched?.applicationStatus === 'interview', 'Status recuperado deve ser "interview"');

  // Atualizar para 'offer'
  repo.updateApplicationStatus(inserted.id, 'offer');
  fetched = repo.getJobById(inserted.id);
  assert(fetched?.applicationStatus === 'offer', 'Status recuperado deve ser "offer"');

  console.log('\n--- 2. Testando Filtros e Consultas do Job Explorer ---');

  // Filtro por Categoria
  const fullstackJobs = repo.getAllJobs({ category: 'Full Stack' });
  assert(fullstackJobs.some((j) => j.id === inserted.id), 'Filtro por categoria deve incluir a vaga inserida');

  // Filtro por Plataforma
  const glassdoorJobs = repo.getAllJobs({ platform: 'glassdoor' });
  assert(glassdoorJobs.some((j) => j.id === inserted.id), 'Filtro por plataforma deve incluir a vaga do Glassdoor');

  // Filtro por Score Mínimo
  const highScoredJobs = repo.getAllJobs({ minScore: 90 });
  assert(highScoredJobs.some((j) => j.id === inserted.id), 'Filtro por minScore deve incluir vaga com score 92');

  // Filtro por Busca Textual
  const searchedJobs = repo.getAllJobs({ search: 'NextCorp' });
  assert(searchedJobs.some((j) => j.id === inserted.id), 'Busca textual deve encontrar vaga por empresa');

  // Filtro por Status
  const offerJobs = repo.getAllJobs({ status: 'offer' });
  assert(offerJobs.some((j) => j.id === inserted.id), 'Filtro por status deve encontrar a vaga na etapa de oferta');

  console.log('\n--- 3. Testando Agregações e Métricas do Dashboard ---');

  const stats = repo.getStats();
  assert(stats.totalJobs > 0, 'Total de vagas nas estatísticas deve ser > 0');
  assert(stats.approvedJobs > 0, 'Total de vagas aprovadas deve ser > 0');
  assert(typeof stats.avgScore === 'number', 'avgScore deve ser um número');
  assert(stats.statusCounts['offer'] >= 1, 'Contagem de status para "offer" deve ser pelo menos 1');
  assert(typeof stats.platformCounts['glassdoor'] === 'number', 'Contagem da plataforma Glassdoor deve existir');
  assert(Array.isArray(stats.topCompanies), 'topCompanies deve ser um array');

  console.log(`\n======================================================`);
  console.log(`  RESULTADO: ${passedTests}/${totalTests} TESTES DA FASE 8 PASSARAM COM SUCESSO!`);
  console.log(`======================================================\n`);
}

testPhase8().catch((err) => {
  console.error('[ERRO NO TESTE DA FASE 8]:', err);
  process.exit(1);
});
