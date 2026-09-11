import dotenv from 'dotenv';
dotenv.config();

import { GupyScraper } from '../src/scrapers/gupy.js';

async function testGupyScraperIsolated() {
  console.log('--- 🧪 Teste Isolado do GupyScraper ---');
  const scraper = new GupyScraper();
  const startTime = Date.now();

  try {
    const jobs = await scraper.scrape();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Sucesso! Vagas encontradas: ${jobs.length} em ${duration}s`);
    console.log('\n--- Primeiras 5 vagas extraídas: ---');
    jobs.slice(0, 5).forEach((j, i) => {
      console.log(`\n[Vaga ${i + 1}]`);
      console.log(`Título: ${j.title}`);
      console.log(`Empresa: ${j.company}`);
      console.log(`Local: ${j.location}`);
      console.log(`Data: ${j.publishedAt.toISOString()}`);
      console.log(`URL: ${j.url}`);
      console.log(`Descrição (resumo): ${j.description?.substring(0, 120)}...`);
    });
  } catch (err: any) {
    console.error('❌ Erro ao executar GupyScraper:', err);
  }
}

testGupyScraperIsolated();
