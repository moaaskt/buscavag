import dotenv from 'dotenv';
dotenv.config();

import { PandapeScraper } from '../src/scrapers/pandape.js';

async function testPandape() {
  console.log('--- 🧪 Teste Isolado do PandaPé ---');
  const scraper = new PandapeScraper();
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

testPandape().catch(console.error);
