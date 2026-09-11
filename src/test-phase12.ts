import { parseRelativeDate, isOlderThanDays } from './utils/date.js';

function runDateTests() {
  console.log('=== TESTE DO MOTOR DE DATAS E FILTRO RÍGIDO (FASE 12) ===\n');

  const testCases = [
    { input: 'Publicado hoje', expectedDaysAgo: 0, shouldBeOlderThan5: false },
    { input: 'há 2 horas', expectedDaysAgo: 0, shouldBeOlderThan5: false },
    { input: 'Publicada ontem', expectedDaysAgo: 1, shouldBeOlderThan5: false },
    { input: 'anteontem', expectedDaysAgo: 2, shouldBeOlderThan5: false },
    { input: 'há 3 dias', expectedDaysAgo: 3, shouldBeOlderThan5: false },
    { input: '4d atrás', expectedDaysAgo: 4, shouldBeOlderThan5: false },
    { input: 'há 5 dias', expectedDaysAgo: 5, shouldBeOlderThan5: false },
    { input: 'há 6 dias', expectedDaysAgo: 6, shouldBeOlderThan5: true },
    { input: '10 dias atrás', expectedDaysAgo: 10, shouldBeOlderThan5: true },
    { input: 'há 1 semana', expectedDaysAgo: 7, shouldBeOlderThan5: true },
    { input: 'há 2 semanas', expectedDaysAgo: 14, shouldBeOlderThan5: true },
    { input: 'há 1 mês', expectedDaysAgo: 30, shouldBeOlderThan5: true },
    { input: '3 days ago', expectedDaysAgo: 3, shouldBeOlderThan5: false },
    { input: '8 days ago', expectedDaysAgo: 8, shouldBeOlderThan5: true },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const parsed = parseRelativeDate(tc.input);
    const older = isOlderThanDays(parsed, 5);

    const now = new Date();
    const diffDays = Math.round((now.getTime() - parsed.getTime()) / (1000 * 60 * 60 * 24));

    const status = (older === tc.shouldBeOlderThan5) ? '✅ PASS' : '❌ FAIL';
    if (older === tc.shouldBeOlderThan5) {
      passed++;
    } else {
      failed++;
    }

    console.log(`${status} | Entrada: "${tc.input}" -> Parsed: ${parsed.toISOString().split('T')[0]} (~${diffDays}d atrás) | >5d? ${older} (Esperado: ${tc.shouldBeOlderThan5})`);
  }

  // Testando datas de calendário absoluto
  console.log('\n--- Teste com Datas Absolutas ---');
  const now = new Date();
  
  // Data de 2 dias atrás
  const d2 = new Date(now);
  d2.setDate(now.getDate() - 2);
  const formattedD2 = `${d2.getDate().toString().padStart(2, '0')}/${(d2.getMonth() + 1).toString().padStart(2, '0')}/${d2.getFullYear()}`;
  const parsedD2 = parseRelativeDate(formattedD2);
  const isOlderD2 = isOlderThanDays(parsedD2, 5);
  console.log(`Data absoluta recente (${formattedD2}): >5d? ${isOlderD2} (Esperado: false) -> ${!isOlderD2 ? '✅ PASS' : '❌ FAIL'}`);
  if (!isOlderD2) passed++; else failed++;

  // Data de 8 dias atrás
  const d8 = new Date(now);
  d8.setDate(now.getDate() - 8);
  const formattedD8 = `${d8.getDate().toString().padStart(2, '0')}/${(d8.getMonth() + 1).toString().padStart(2, '0')}/${d8.getFullYear()}`;
  const parsedD8 = parseRelativeDate(formattedD8);
  const isOlderD8 = isOlderThanDays(parsedD8, 5);
  console.log(`Data absoluta antiga (${formattedD8}): >5d? ${isOlderD8} (Esperado: true) -> ${isOlderD8 ? '✅ PASS' : '❌ FAIL'}`);
  if (isOlderD8) passed++; else failed++;

  console.log(`\n========================================`);
  console.log(`Total de testes: ${passed + failed} | Aprovados: ${passed} | Falhas: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runDateTests();
