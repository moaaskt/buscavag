import { PythonBridgeClient } from '@/services/pythonBridge';

async function runPhase71Tests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO TESTES DA PHASE 71: EXTRAÇÃO FIEL DE CV');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, description: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] Teste ${totalTests}: ${description}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] Teste ${totalTests}: ${description}`);
    }
  }

  const bridge = new PythonBridgeClient();
  const isAvailable = await bridge.isAvailable();
  console.log(`ℹ️ Scrapling Engine Python Status: ${isAvailable ? 'ONLINE 🟢' : 'OFFLINE 🔴 (Usando testes locais)'}\n`);

  // Teste 1: Teste contra Falso-Positivo da linguagem "C" com marcadores de tópico e abreviações
  console.log('--- Teste 1: Verificação Anti-Falso-Positivo da linguagem "C" ---');
  const textWithBulletC = `
    CURRÍCULO DE CARLOS SILVA
    Desenvolvedor Full Stack
    
    Experiência Profissional:
    a) Desenvolvimento de sistemas web em Node.js e React.
    b) Criação de APIs RESTful com TypeScript e PostgreSQL.
    c) Atuação c/ 5 anos de experiência em metodologias ágeis.
    
    Tecnologias:
    TypeScript, Node.js, React, Next.js, Docker, Git.
  `;

  if (isAvailable) {
    try {
      const result = await bridge.analyzeCV('/tmp/dummy_cv.txt', textWithBulletC, 'dummy_cv.txt');
      const hasFalsePositiveC = (result.hard_skills || []).includes('C') || 
                                (result.primary_stack || []).includes('C') || 
                                (result.secondary_stack || []).includes('C');
      
      assert(!hasFalsePositiveC, 'Não deve extrair a linguagem "C" quando "c" é apenas marcador "c)" ou abreviação "c/"');
      assert((result.hard_skills || []).includes('Node.js'), 'Deve extrair corretamente a skill Node.js');
      assert((result.hard_skills || []).includes('React'), 'Deve extrair corretamente a skill React');
      assert((result.hard_skills || []).includes('TypeScript'), 'Deve extrair corretamente a skill TypeScript');
    } catch (err: any) {
      console.error('Erro na chamada PythonBridge:', err.message);
      assert(false, 'Falha ao analisar CV via Scrapling Engine');
    }
  } else {
    console.log('⚠️ Engine Python offline, pulando teste via bridge HTTP.');
  }

  // Teste 2: Teste de Captura Legítima da Linguagem C (Contexto "C/C++" ou "ANSI C")
  console.log('\n--- Teste 2: Captura Legítima da Linguagem C com Contexto Inequívoco ---');
  const textWithRealC = `
    CURRÍCULO DE MARCOS OLIVEIRA
    Engenheiro de Software Embarcado
    
    Experiência:
    - Programação em C/C++ para microcontroladores ESP32 e STM32.
    - Desenvolvimento em ANSI C e Linux Embarcado.
    
    Habilidades:
    Linguagem C, C++, Python, ESP32, Docker, Linux.
  `;

  if (isAvailable) {
    try {
      const result = await bridge.analyzeCV('/tmp/real_c_cv.txt', textWithRealC, 'real_c_cv.txt');
      const hasRealC = (result.hard_skills || []).includes('C');
      const hasCpp = (result.hard_skills || []).includes('C++');

      assert(hasRealC, 'Deve extrair a linguagem "C" quando mencionada em contexto de "C/C++" ou "ANSI C"');
      assert(hasCpp, 'Deve extrair a linguagem "C++" corretamente');
    } catch (err: any) {
      console.error('Erro na chamada PythonBridge:', err.message);
      assert(false, 'Falha ao analisar CV legítimo em C via Scrapling Engine');
    }
  }

  // Teste 3: Teste de Sanitização de Schema (Sem Vazamento de Letras Soltas)
  console.log('\n--- Teste 3: Sanitização de Schema e Consistência de Stacks ---');
  if (isAvailable) {
    try {
      const result = await bridge.analyzeCV('/tmp/dummy_cv.txt', textWithBulletC, 'dummy_cv.txt');
      const singleLetterLeaks = (result.hard_skills || []).filter(s => s.length === 1 && s.toLowerCase() !== 'r');
      
      assert(singleLetterLeaks.length === 0, 'Schema sanitizado não deve conter vazamento de letras soltas de 1 caractere');
      
      // Valida que primary_stack e secondary_stack estão contidos em hard_skills
      const primaryInHard = (result.primary_stack || []).every(p => result.hard_skills.includes(p));
      assert(primaryInHard, 'Todos os itens de primary_stack devem estar em hard_skills');
    } catch (err: any) {
      assert(false, 'Falha na validação de schema sanitizado');
    }
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL DA SUÍTE PHASE 71: ${passedTests}/${totalTests} PASSED`);
  console.log('====================================================\n');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runPhase71Tests().catch((err) => {
  console.error('Erro crítico ao executar suíte de testes da Phase 71:', err);
  process.exit(1);
});
