import fs from 'fs';
import path from 'path';
import { LogRepository } from './db/logRepository';

async function runPhase82Tests() {
  console.log('--- INICIANDO TESTES DETERMINÍSTICOS DA PHASE 82 (ISOLAMENTO DE LAYOUT ADMIN & (PUBLIC)) ---');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (!condition) {
      console.error(`❌ [TEST ${total}] FALHOU: ${testName}`);
      process.exit(1);
    }
    passed++;
    console.log(`✅ [TEST ${total}] PASSOU: ${testName}`);
  }

  const rootDir = process.cwd();

  // Test 1: Verificar que src/app/layout.tsx não contém referências a Navbar ou AuroraBackground
  const rootLayoutContent = fs.readFileSync(path.join(rootDir, 'src/app/layout.tsx'), 'utf-8');
  assert(
    !rootLayoutContent.includes('<Navbar') &&
    !rootLayoutContent.includes('from "@/components/Navbar"') &&
    !rootLayoutContent.includes('<AuroraBackground'),
    'RootLayout (src/app/layout.tsx) não deve importar nem renderizar Navbar ou AuroraBackground'
  );

  // Test 2: Verificar que src/app/(public)/layout.tsx existe e contém Navbar e AuroraBackground
  const publicLayoutPath = path.join(rootDir, 'src/app/(public)/layout.tsx');
  assert(fs.existsSync(publicLayoutPath), 'src/app/(public)/layout.tsx deve existir');
  const publicLayoutContent = fs.readFileSync(publicLayoutPath, 'utf-8');
  assert(
    publicLayoutContent.includes('<Navbar />') &&
    publicLayoutContent.includes('<AuroraBackground>') &&
    publicLayoutContent.includes('<footer'),
    'src/app/(public)/layout.tsx deve envelopar as páginas com Navbar, AuroraBackground e footer'
  );

  // Test 3: Verificar que as rotas públicas principais estão sob src/app/(public)
  const publicPages = ['page.tsx', 'jobs/page.tsx', 'pricing/page.tsx', 'login/page.tsx', 'board/page.tsx', 'candidate/page.tsx'];
  for (const page of publicPages) {
    const pagePath = path.join(rootDir, 'src/app/(public)', page);
    assert(fs.existsSync(pagePath), `Página pública ${page} deve estar localizada sob src/app/(public)/`);
  }

  // Test 4: Verificar que src/app/admin/layout.tsx existe e define o container admin isolado
  const adminLayoutPath = path.join(rootDir, 'src/app/admin/layout.tsx');
  assert(fs.existsSync(adminLayoutPath), 'src/app/admin/layout.tsx deve existir');
  const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf-8');
  assert(
    adminLayoutContent.includes('admin-root-container') &&
    !adminLayoutContent.includes('<Navbar') &&
    !adminLayoutContent.includes('AdminLayout'),
    'src/app/admin/layout.tsx deve isolar o container sem Sidebar global e sem Navbar pública'
  );

  // Test 5: Verificar que a sub-rota /admin/login renderiza container próprio sem Sidebar interna
  const adminLoginPath = path.join(rootDir, 'src/app/admin/login/page.tsx');
  assert(fs.existsSync(adminLoginPath), 'src/app/admin/login/page.tsx deve existir');
  const adminLoginContent = fs.readFileSync(adminLoginPath, 'utf-8');
  assert(
    !adminLoginContent.includes('AdminLayout') &&
    !adminLoginContent.includes('AdminSidebar'),
    'src/app/admin/login/page.tsx não deve incluir a Sidebar do painel interno'
  );

  // Test 6: Verificar compatibilidade de LogRepository (getLogs, getRecentRuns, insertScraperLog)
  const repo = new LogRepository();
  assert(typeof repo.getLogs === 'function', 'LogRepository deve expor getLogs para o scraper');
  assert(typeof repo.getRecentRuns === 'function', 'LogRepository deve expor getRecentRuns para o scraper');
  assert(typeof repo.insertScraperLog === 'function', 'LogRepository deve expor insertScraperLog');

  // Test 7: Inserção de log scraper e consulta
  const testRunId = `test-run-${Date.now()}`;
  const scraperLog = repo.insertLog({
    runId: testRunId,
    scraperName: 'TestPhase82Scraper',
    level: 'INFO',
    message: 'Mensagem de teste de compatibilidade',
  });
  assert(scraperLog.runId === testRunId, 'insertLog deve retornar objeto ScraperLog válido');
  
  const { logs } = repo.getLogs({ runId: testRunId });
  assert(logs.length >= 1 && logs[0].scraperName === 'TestPhase82Scraper', 'getLogs deve retornar os logs do runId filtrado');

  console.log(`\n======================================================`);
  console.log(`RESULTADO FINAL DA SUÍTE PHASE 82: ${passed}/${total} TESTES PASSARAM!`);
  console.log(`======================================================\n`);
}

runPhase82Tests().catch((err) => {
  console.error('Erro na execução dos testes da Phase 82:', err);
  process.exit(1);
});
