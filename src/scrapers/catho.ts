import { createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class CathoScraper implements JobScraper {
  name = 'Catho';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrls = [
      'https://www.catho.com.br/vagas/desenvolvedor-full-stack-junior/',
      'https://www.catho.com.br/vagas/desenvolvedor-junior/',
    ];

    for (const searchUrl of searchUrls) {
      const { browser, context, page } = await createStealthContext();

      try {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(4000);

        // Fechar possíveis modais de cookie ou popups
        try {
          const closeBtn = await page.$('[data-testid="close-button"], .cookie-accept, [class*="close"], button[aria-label="Fechar"]');
          if (closeBtn) await closeBtn.click();
          await page.waitForTimeout(500);
        } catch {
          // Nenhum modal encontrado, seguir
        }

        // Buscar cards de vagas - Catho usa article ou divs com data-testid
        const cards = await page.$$('article, [data-testid*="job"], [class*="job-card"], [class*="resultados"] li, [class*="search-result"]');

        for (const card of cards) {
          try {
            const titleEl = await card.$('h2, h3, a[href*="/vagas/"], [class*="title"], [data-testid*="title"]');
            const companyEl = await card.$('[class*="company"], [data-testid*="company"], [class*="empresa"]');
            const locationEl = await card.$('[class*="location"], [class*="local"], [data-testid*="location"]');
            const linkEl = await card.$('a[href*="/vagas/"], a[href*="catho.com.br"]');
            const dateEl = await card.$('[class*="date"], [class*="data"], time, [class*="published"]');

            const title = titleEl ? (await titleEl.innerText()).trim() : '';
            const company = companyEl ? (await companyEl.innerText()).trim() : '';
            const location = locationEl ? (await locationEl.innerText()).trim() : '';
            const href = linkEl ? await linkEl.getAttribute('href') : '';
            const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';

            if (!title) continue;

            const publishedAt = parseRelativeDate(dateStr);
            if (isOlderThanDays(publishedAt, 5)) continue;

            const fullUrl = href
              ? (href.startsWith('http') ? href : `https://www.catho.com.br${href}`)
              : searchUrl;

            jobs.push({
              title,
              company: company || 'Catho',
              platform: PlatformSource.CATHO,
              url: fullUrl,
              description: `${title} - ${company || 'Empresa Catho'}`,
              publishedAt,
              location: location || 'Brasil',
            });
          } catch {
            // Ignorar erro individual por card
          }
        }
      } catch (err) {
        console.warn(`[CathoScraper] Playwright erro para ${searchUrl}:`, (err as Error).message);
      } finally {
        await context.close();
        await browser.close();
      }
    }

    return jobs;
  }
}
