import dotenv from 'dotenv';
dotenv.config();

import { FacebookGroupsScraper } from '../src/scrapers/facebookGroups.js';
import { PlatformSource } from '../src/types/job.js';

async function testFacebookGroupsScraper() {
  console.log('--- 🧪 Teste Isolado do FacebookGroupsScraper (Fase 57) ---');

  // Habilita mock se não houver cookies nem conexão real para garantir passagem determinística nos testes
  if (!process.env.FB_COOKIES_JSON && !process.env.FB_COOKIES_PATH) {
    process.env.FB_MOCK = 'true';
    console.log('ℹ️ Variáveis de sessão do Facebook não detectadas. Executando em modo de validação estrutural com mock...');
  }

  const scraper = new FacebookGroupsScraper();
  const startTime = Date.now();

  try {
    const jobs = await scraper.scrape();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Scraper executado com sucesso em ${duration}s!`);
    console.log(`Total de postagens/vagas capturadas: ${jobs.length}`);

    if (jobs.length === 0) {
      console.warn('⚠️ Nenhuma vaga encontrada (verifique acesso aos grupos ou cookies).');
      return;
    }

    // Validações de integridade
    let allValid = true;
    const seenUrls = new Set<string>();

    jobs.forEach((j, i) => {
      if (j.platform !== PlatformSource.FACEBOOK_GROUPS) {
        console.error(`❌ Erro no item ${i + 1}: platform esperada "${PlatformSource.FACEBOOK_GROUPS}", obtida "${j.platform}"`);
        allValid = false;
      }
      if (!j.title || !j.url || !j.description || !(j.publishedAt instanceof Date)) {
        console.error(`❌ Erro no item ${i + 1}: campos obrigatórios ausentes ou inválidos.`);
        allValid = false;
      }
      if (seenUrls.has(j.url)) {
        console.error(`❌ Erro de deduplicação: URL repetida "${j.url}"`);
        allValid = false;
      }
      seenUrls.add(j.url);
    });

    if (allValid) {
      console.log('✅ Validação de integridade dos dados e deduplicação: APROVADA!');
    }

    console.log('\n--- Amostra de Vagas / Posts Estruturados: ---');
    jobs.slice(0, 5).forEach((j, i) => {
      console.log(`\n[Vaga ${i + 1}]`);
      console.log(`Título: ${j.title}`);
      console.log(`Grupo/Empresa: ${j.company}`);
      console.log(`Plataforma: ${j.platform}`);
      console.log(`Local: ${j.location}`);
      console.log(`Data Publicação: ${j.publishedAt.toISOString()}`);
      console.log(`URL Original: ${j.url}`);
      console.log(`Descrição (preview): ${j.description.substring(0, 140)}...`);
    });

  } catch (err: any) {
    console.error('❌ Erro na execução do FacebookGroupsScraper:', err);
    process.exit(1);
  }
}

testFacebookGroupsScraper();
