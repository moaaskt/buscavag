import dotenv from 'dotenv';
import { HermesEvaluator } from './services/hermesEvaluator.js';
import { JobRepository } from './db/repository.js';
import { TelegramNotifier } from './services/telegramNotifier.js';
import { PlatformSource } from './types/job.js';
dotenv.config();
async function testPhase7() {
    console.log(`\n======================================================`);
    console.log(`  BUSCAVAG - TESTE FASE 7: ADVANCED AI MATCHING & RANKING`);
    console.log(`  Executado em: ${new Date().toLocaleString('pt-BR')}`);
    console.log(`======================================================\n`);
    const evaluator = new HermesEvaluator();
    const repo = new JobRepository();
    const notifier = new TelegramNotifier();
    let passedTests = 0;
    let totalTests = 0;
    function assert(condition, message) {
        totalTests++;
        if (condition) {
            console.log(`  ✅ [PASS] ${message}`);
            passedTests++;
        }
        else {
            console.error(`  ❌ [FAIL] ${message}`);
            throw new Error(`Falha no teste: ${message}`);
        }
    }
    console.log('--- 1. Testando Heurística e Avaliação com Diferentes Perfis de Vagas ---');
    // Vaga 1: Jr Full Stack Remoto com Node, React e GraphQL/AWS (gaps)
    const job1 = {
        title: 'Desenvolvedor Full Stack Junior',
        company: 'TechCorp Remota',
        platform: PlatformSource.PROGRAMATHOR,
        url: 'https://programathor.com.br/jobs/test-phase7-1',
        description: 'Buscamos dev jr com conhecimentos em Node.js, TypeScript, React, Docker, Postgres. Desejável AWS e GraphQL.',
        publishedAt: new Date(),
        location: 'Remoto',
    };
    const eval1 = evaluator.evaluateHeuristic(job1);
    console.log('Resultado Vaga 1 (Jr Full Stack Remoto):', {
        overallScore: eval1.overallScore,
        stackScore: eval1.stackScore,
        seniorityScore: eval1.seniorityScore,
        locationScore: eval1.locationScore,
        category: eval1.category,
        gaps: eval1.gaps,
        resumeTips: eval1.resumeTips,
        approved: eval1.isJuniorFullStack,
    });
    assert(eval1.isJuniorFullStack === true, 'Vaga Jr Full Stack Remoto deve ser aprovada');
    assert(eval1.locationScore === 100, 'Score de localização remota deve ser 100');
    assert(eval1.seniorityScore === 100, 'Score de senioridade Jr deve ser 100');
    assert(eval1.stackScore > 50, 'Score de stack compatível deve ser alto');
    assert(eval1.category === 'Full Stack', 'Categoria identificada deve ser Full Stack');
    assert(eval1.gaps.includes('aws') || eval1.gaps.includes('graphql'), 'Gaps devem identificar aws ou graphql');
    assert(eval1.resumeTips.length > 0, 'Dicas de currículo devem ser geradas');
    // Vaga 2: Senior em São Paulo Presencial (Rejeitada)
    const job2 = {
        title: 'Desenvolvedor Sênior Tech Lead',
        company: 'Paulista Corp',
        platform: PlatformSource.CATHO,
        url: 'https://catho.com.br/vagas/test-phase7-2',
        description: 'Vaga para Tech Lead com 8 anos de experiência em Java e Spring.',
        publishedAt: new Date(),
        location: 'São Paulo - SP',
    };
    const eval2 = evaluator.evaluateHeuristic(job2);
    console.log('Resultado Vaga 2 (Sênior Presencial SP):', {
        overallScore: eval2.overallScore,
        locationScore: eval2.locationScore,
        seniorityScore: eval2.seniorityScore,
        approved: eval2.isJuniorFullStack,
    });
    assert(eval2.isJuniorFullStack === false, 'Vaga Senior Presencial SP deve ser rejeitada');
    assert(eval2.locationScore === 0, 'Location score fora do escopo deve ser 0');
    assert(eval2.seniorityScore <= 20, 'Seniority score para sênior deve ser baixo');
    console.log('\n--- 2. Testando Persistência no SQLite com os Novos Campos ---');
    const inserted = repo.insert(job1, eval1);
    assert(inserted.id.length > 0, 'Vaga deve ser inserida e ter um ID hash');
    assert(inserted.overallScore === eval1.overallScore, 'overallScore persistido corretamente');
    assert(inserted.category === 'Full Stack', 'category persistido corretamente');
    assert(Array.isArray(inserted.gaps), 'gaps deve ser um array');
    assert(inserted.resumeTips === eval1.resumeTips, 'resumeTips persistido corretamente');
    const pendingList = repo.getPendingNotifications();
    const found = pendingList.find((j) => j.id === inserted.id);
    assert(!!found, 'Vaga aprovada deve estar listada nas notificações pendentes');
    assert(found?.overallScore === eval1.overallScore, 'Registro recuperado mantém overallScore');
    assert(found?.stackScore === eval1.stackScore, 'Registro recuperado mantém stackScore');
    assert(found?.seniorityScore === eval1.seniorityScore, 'Registro recuperado mantém seniorityScore');
    assert(found?.locationScore === eval1.locationScore, 'Registro recuperado mantém locationScore');
    assert(found?.category === 'Full Stack', 'Registro recuperado mantém category');
    assert(Array.isArray(found?.gaps), 'Registro recuperado tem gaps desserializado como array');
    assert(found?.resumeTips === eval1.resumeTips, 'Registro recuperado mantém resumeTips');
    console.log('\n--- 3. Testando Formatação da Notificação no Telegram ---');
    const telegramMsg = notifier.formatJobMessage(found);
    console.log('Mensagem formatada para Telegram:\n----------------------------------------\n' + telegramMsg + '\n----------------------------------------');
    assert(telegramMsg.includes('Categoria:'), 'Mensagem do Telegram deve conter a Categoria');
    assert(telegramMsg.includes('Score Geral:'), 'Mensagem do Telegram deve conter o Score Geral');
    assert(telegramMsg.includes('Stack:') && telegramMsg.includes('Nível:') && telegramMsg.includes('Local:'), 'Mensagem do Telegram deve decompor scores');
    assert(!telegramMsg.includes(found?.resumeTips), 'Mensagem do Telegram NÃO DEVE vazar resumeTips por privacidade');
    // Marcar como notificada para limpar
    repo.markAsNotified(inserted.id);
    console.log(`\n======================================================`);
    console.log(`  RESULTADO: ${passedTests}/${totalTests} TESTES PASSARAM COM SUCESSO!`);
    console.log(`======================================================\n`);
}
testPhase7().catch((err) => {
    console.error('[ERRO NO TESTE DA FASE 7]:', err);
    process.exit(1);
});
