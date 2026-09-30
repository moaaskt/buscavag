import { HermesEvaluator } from './services/hermesEvaluator.js';
import { JobRepository } from './db/repository.js';
import { RawJob, PlatformSource } from './types/job.js';

async function testPhase62() {
  console.log('--- Testando Fase 62: Parser Semântico com Hermes IA & Extração de Contato Direto ---\n');

  const evaluator = new HermesEvaluator();
  const repo = new JobRepository();

  // Caso 1: Post com e-mail e link de ATS (Gupy) -> Heurística com Regex Fallback
  const rawPostWithEmail: RawJob = {
    title: 'Desenvolvedor Full Stack Júnior',
    company: 'Tech Inovadora',
    platform: PlatformSource.LINKEDIN_POSTS,
    url: 'https://linkedin.com/feed/update/urn:li:activity:999888777',
    description: 'Estamos contratando Dev Full Stack Jr com Node.js e React! Interessados podem se inscrever na nossa Gupy https://empresa.gupy.io ou enviar o currículo diretamente para recrutamento.tech@empresa.com.br com pretensão salarial.',
    publishedAt: new Date(),
    location: 'Remoto',
  };

  console.log('[1/3] Testando evaluateHeuristic com captura por Regex...');
  const heuristicResult = evaluator.evaluateHeuristic(rawPostWithEmail);

  console.log('Resultado Heurístico:');
  console.log(`- Aprovado Jr: ${heuristicResult.isJuniorFullStack}`);
  console.log(`- Score: ${heuristicResult.overallScore}`);
  console.log(`- Contato Direto extraído: "${heuristicResult.directContact}"`);

  if (heuristicResult.directContact !== 'recrutamento.tech@empresa.com.br') {
    throw new Error(`Falha no Regex fallback: esperado "recrutamento.tech@empresa.com.br", obtido "${heuristicResult.directContact}"`);
  }
  console.log('✅ [SUCESSO] Regex Heurístico capturou o e-mail prioritário com perfeição!');

  // Caso 2: Persistência no SQLite
  console.log('\n[2/3] Testando inserção no JobRepository com direct_contact...');
  const insertedJob = repo.insert(rawPostWithEmail, heuristicResult);
  console.log(`- Vaga inserida com ID: ${insertedJob.id}`);
  console.log(`- directContact retornado pelo insert: ${insertedJob.directContact}`);

  console.log('\n[3/3] Recuperando do banco de dados (getJobById)...');
  const fetchedJob = repo.getJobById(insertedJob.id);
  console.log(`- directContact persistido no banco: ${fetchedJob?.directContact}`);

  if (fetchedJob?.directContact !== 'recrutamento.tech@empresa.com.br') {
    throw new Error(`Falha na persistência no DB: esperado "recrutamento.tech@empresa.com.br", obtido "${fetchedJob?.directContact}"`);
  }
  console.log('✅ [SUCESSO] Coluna direct_contact gravada e recuperada do SQLite com integridade!');

  // Limpeza do teste
  repo.deleteJobs([insertedJob.id]);
  console.log('\n✅ Limpeza do registro de teste concluída com sucesso.');

  console.log('\n🎉 TODOS OS TESTES DA FASE 62 PASSARAM COM SUCESSO!');
}

testPhase62().catch((err) => {
  console.error('❌ Erro na execução dos testes da Fase 62:', err);
  process.exit(1);
});
