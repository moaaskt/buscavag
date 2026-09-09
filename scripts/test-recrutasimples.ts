import dotenv from 'dotenv';
dotenv.config();

import { RecrutaSimplesScraper } from '../src/scrapers/recrutaSimples.js';

async function testRecrutaSimples() {
  console.log('--- 🧪 Teste Isolado do Recruta Simples ---');
  const scraper = new RecrutaSimplesScraper();
  const start = Date.now();
  const jobs = await scraper.scrape();
  const dur = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`\nResultado: ${jobs.length} vagas capturadas em ${dur}s`);
  jobs.slice(0, 5).forEach((j, i) => {
    console.log(`\n[Vaga ${i + 1}]`);
    console.log(`Título: ${j.title}`);
    console.log(`Empresa: ${j.company}`);
    console.log(`Local: ${j.location}`);
    console.log(`Data: ${j.publishedAt.toISOString()}`);
    console.log(`URL: ${j.url}`);
  });
}

testRecrutaSimples().catch(console.error);
