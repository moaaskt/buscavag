import dotenv from 'dotenv';
dotenv.config();

import { NerdinScraper } from '../src/scrapers/nerdin.js';

async function test() {
  console.log('--- 🧪 Teste Isolado do Nerdin ---');
  const scraper = new NerdinScraper();
  const start = Date.now();
  const jobs = await scraper.scrape();
  const dur = ((Date.now() - start) / 1000).toFixed(2);

  console.log(`\nResultado: ${jobs.length} vagas capturadas em ${dur}s`);
  jobs.slice(0, 5).forEach((j, i) => {
    console.log(`\n[Vaga ${i + 1}]`);
    console.log(`Título: ${j.title}`);
    console.log(`Empresa: ${j.company}`);
    console.log(`Local: ${j.location}`);
    console.log(`URL: ${j.url}`);
  });
}

test().catch(console.error);
