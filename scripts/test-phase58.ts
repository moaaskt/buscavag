import { HermesEvaluator } from '../src/services/hermesEvaluator';
import { PlatformSource, RawJob } from '../src/types/job';
import { JobRepository } from '../src/db/repository';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('Iniciando Teste Phase 58: Extração de Metadados via Hermes AI');

  const evaluator = new HermesEvaluator();
  const repo = new JobRepository();

  const mockJob: RawJob = {
    title: '[Vaga] Desenvolvedor Fullstack Node/React Jr - Remoto',
    company: 'Facebook: Programadores Brasil',
    platform: PlatformSource.FACEBOOK_GROUPS,
    url: `https://www.facebook.com/groups/programadores.brasil/posts/final_${Date.now()}`,
    description: `🚀 Vaga Aberta: Dev Fullstack Node.js e React Júnior!
Estamos buscando um desenvolvedor júnior para atuar em projetos de automação e web corporativa.
Requisitos:
- Experiência prévia com Node.js e ReactJS.
- Conhecimento básico em SQL (PostgreSQL).
- Gostar de desafios!

Modelo de contratação: PJ
Salário: R$ 4.500,00 a R$ 5.500,00
Local: 100% Remoto 🏡

Interessados devem enviar currículo para vagas@techstartup.com.br com o assunto "Dev Fullstack Jr" ou me chamar na DM!
`,
    publishedAt: new Date(),
    location: 'Remoto / Facebook Group',
  };

  console.log('\n--- Vaga Original (RawJob) ---');
  console.log(mockJob);

  console.log('\n--- Executando Avaliação via Hermes AI ---');
  try {
    const result = await evaluator.evaluate(mockJob);
    console.log('\n--- Resultado do Hermes (EvaluationResult) ---');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n--- Inserindo no Banco de Dados ---');
    const processedJob = repo.insert(mockJob, result);
    
    console.log('\n--- Vaga Processada (Recuperada do Repositório) ---');
    console.log(JSON.stringify(processedJob, null, 2));
    
    console.log('\n[✔] Teste concluído com sucesso!');
  } catch (err) {
    console.error('[ERRO] Falha no teste:', err);
  }
}

run();
