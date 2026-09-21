import { LinkedInPostsScraper } from '../src/scrapers/linkedinPosts.js';

async function runTest() {
  console.log('Iniciando teste do LinkedInPostsScraper...');
  // Force test environment so we get the mocked jobs if there are no valid cookies.
  process.env.NODE_ENV = 'test';
  
  const scraper = new LinkedInPostsScraper();
  
  try {
    const jobs = await scraper.scrape();
    console.log(`\n✅ Sucesso! Encontradas ${jobs.length} vagas/posts.`);
    if (jobs.length > 0) {
      console.log('\nExemplos de Vagas Encontradas:');
      for (const [index, job] of jobs.slice(0, 3).entries()) {
        console.log(`\n--- Vaga ${index + 1} ---`);
        console.log(`Title: ${job.title}`);
        console.log(`Company (Author): ${job.company}`);
        console.log(`URL: ${job.url}`);
        console.log(`Description Snippet: ${job.description.substring(0, 150)}...`);
      }
    }
  } catch (error) {
    console.error('❌ Erro no scraper:', error);
  }
}

runTest();
