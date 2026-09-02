import { HermesEvaluator } from './services/hermesEvaluator.js';
import { PlatformSource } from './types/job.js';
async function testAiEvaluator() {
    console.log('--- Testando HermesEvaluator (AI & Fallback Heurístico) ---');
    const evaluator = new HermesEvaluator();
    const testJobs = [
        {
            title: 'Desenvolvedor Full Stack Junior',
            company: 'TechCorp',
            platform: PlatformSource.LINKEDIN,
            url: 'https://example.com/job/1',
            description: 'Buscamos Dev Full Stack Jr apaixonado por React, Node.js e TypeScript. Experiência de 0 a 2 anos.',
            publishedAt: new Date(),
        },
        {
            title: 'Desenvolvedor Full Stack Senior / Lead',
            company: 'Enterprise Inc',
            platform: PlatformSource.INDEED,
            url: 'https://example.com/job/2',
            description: 'Vaga para especialista Senior com no mínimo 6 anos de experiência em microserviços e arquitetura de nuvem.',
            publishedAt: new Date(),
        },
        {
            title: 'Engenheiro de Software Jr',
            company: 'Startup BR',
            platform: PlatformSource.GUPY,
            url: 'https://example.com/job/3',
            description: 'Atuação inicial em projetos web. Conhecimentos em HTML, CSS, JavaScript e Python.',
            publishedAt: new Date(),
        },
    ];
    for (const job of testJobs) {
        console.log(`\nAvaliando: "${job.title}" | Empresa: ${job.company}`);
        const result = await evaluator.evaluate(job);
        console.log(`Resultado -> Aprovado Jr Fullstack: ${result.isJuniorFullStack} | Score: ${result.score}/100`);
        console.log(`Parecer -> ${result.reasoning}`);
    }
    console.log('\n--- Teste da Fase 4 Concluído ---');
}
testAiEvaluator().catch(console.error);
