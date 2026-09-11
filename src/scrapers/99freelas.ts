import * as cheerio from 'cheerio';
import { fetchHtml, createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class Freelas99Scraper implements JobScraper {
  name = '99Freelas';

  private techKeywords = [
    'react', 'next', 'nextjs', 'node', 'nodejs', 'typescript', 'ts', 'javascript', 'js',
    'python', 'php', 'laravel', 'codeigniter', 'nestjs', 'express', 'vue', 'tailwind',
    'iot', 'esp32', 'esp8266', 'arduino', 'raspberry', 'mqtt', 'home assistant', 'automacao', 'automação',
    'full stack', 'fullstack', 'frontend', 'front-end', 'backend', 'back-end', 'rest', 'api', 'docker',
    'postgres', 'mysql', 'supabase', 'web'
  ];

  async scrape(): Promise<RawJob[]> {
    try {
      return await this.scrapeViaHttp();
    } catch (err) {
      console.warn('[99FreelasScraper] HTTP falhou, tentando fallback Playwright:', (err as Error).message);
      return await this.scrapeViaPlaywright();
    }
  }

  private async scrapeViaHttp(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrls = [
      'https://www.99freelas.com.br/projects?categoria=web-mobile-e-software',
      'https://www.99freelas.com.br/projects?categoria=web-mobile-e-software&subcategoria=desenvolvimento-web-e-mobile',
    ];

    for (const url of searchUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.result-item, .item, .project-item, li.item-list, .results-list > li').each((_, el) => {
          const titleEl = $(el).find('h1.title a, h2.title a, h3.title a, a.title, a[href*="/project/"]');
          const descriptionEl = $(el).find('.descricao, .description, .item-text, p');
          const dateEl = $(el).find('.datetime, .data, .date, .item-details .data, span:contains("atrás"), span:contains("publicado")');
          const priceEl = $(el).find('.price, .valor, .orcamento, .item-price');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || '';
          if (!title || !href) return;

          const description = descriptionEl.text().trim();
          const dateStr = dateEl.text().trim();
          const price = priceEl.text().trim();

          // 1. FILTRO ESTRITO DE STACK TECH
          const textToMatch = `${title} ${description}`.toLowerCase();
          const hasTechMatch = this.techKeywords.some((kw) => textToMatch.includes(kw));
          if (!hasTechMatch) return;

          // 2. TRAVA TEMPORAL DE 48 HORAS (2 DIAS)
          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 2)) return;

          const fullUrl = href.startsWith('http') ? href : `https://www.99freelas.com.br${href.startsWith('/') ? '' : '/'}${href}`;
          const fullDesc = `[Projeto Freelancer] ${title} - ${description ? description.slice(0, 300) : 'Sem detalhes'} ${price ? `(Orçamento: ${price})` : ''}`.trim();

          jobs.push({
            title: `[Freela] ${title}`,
            company: '99Freelas (Cliente Privado)',
            platform: PlatformSource.FREELAS99,
            url: fullUrl,
            description: fullDesc,
            publishedAt,
            location: 'Remoto (Freelance)',
          });
        });
      } catch (err) {
        console.warn(`[99FreelasScraper] Erro ao buscar URL "${url}":`, (err as Error).message);
      }
    }

    if (jobs.length > 0) return jobs;
    throw new Error('Nenhum projeto capturado via HTTP');
  }

  private async scrapeViaPlaywright(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const url = 'https://www.99freelas.com.br/projects?categoria=web-mobile-e-software';
    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const items = await page.$$('.result-item, .project-item, li.item-list, .results-list > li');

      for (const item of items) {
        try {
          const titleEl = await item.$('h1.title a, h2.title a, h3.title a, a.title, a[href*="/project/"]');
          const descEl = await item.$('.descricao, .description, .item-text, p');
          const dateEl = await item.$('.datetime, .data, .date, span:contains("atrás")');

          const title = titleEl ? (await titleEl.innerText()).trim() : '';
          const href = titleEl ? await titleEl.getAttribute('href') : '';
          const desc = descEl ? (await descEl.innerText()).trim() : '';
          const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';

          if (!title || !href) continue;

          // 1. FILTRO ESTRITO DE STACK TECH
          const textToMatch = `${title} ${desc}`.toLowerCase();
          const hasTechMatch = this.techKeywords.some((kw) => textToMatch.includes(kw));
          if (!hasTechMatch) continue;

          // 2. TRAVA DE 48 HORAS
          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 2)) continue;

          const fullUrl = href.startsWith('http') ? href : `https://www.99freelas.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title: `[Freela] ${title}`,
            company: '99Freelas (Cliente Privado)',
            platform: PlatformSource.FREELAS99,
            url: fullUrl,
            description: `[Projeto Freelancer] ${title} - ${desc ? desc.slice(0, 300) : 'Sem detalhes'}`.trim(),
            publishedAt,
            location: 'Remoto (Freelance)',
          });
        } catch {
          // Ignorar item com erro
        }
      }
    } catch (err) {
      console.warn('[99FreelasScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }
}
