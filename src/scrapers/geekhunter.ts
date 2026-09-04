import * as cheerio from 'cheerio';
import { fetchHtml, createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class GeekHunterScraper implements JobScraper {
  name = 'GeekHunter';

  async scrape(): Promise<RawJob[]> {
    try {
      return await this.scrapeViaHttp();
    } catch (err) {
      console.warn('[GeekHunterScraper] HTTP falhou, tentando Playwright:', (err as Error).message);
      return await this.scrapeViaPlaywright();
    }
  }

  private async scrapeViaHttp(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = ['desenvolvedor', 'junior', 'fullstack', 'react', 'node', 'python'];

    for (const slug of searchSlugs) {
      try {
        const url = `https://www.geekhunter.com.br/vagas?q=${encodeURIComponent(slug)}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.job-card, .vaga-card, [data-testid="job-card"], article, .job-item').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .job-title, a[href*="/vagas/"]');
          const companyEl = $(el).find('.company-name, .company, .empresa');
          const locationEl = $(el).find('.location, .cidade, .job-location');
          const dateEl = $(el).find('time, .date, .data');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'GeekHunter Empresa';
          const location = locationEl.text().trim() || 'Remoto';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 7)) return;

          const fullUrl = href.startsWith('http') ? href : `https://www.geekhunter.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.GEEKHUNTER,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[GeekHunterScraper] Aviso para "${slug}":`, (err as Error).message);
      }
    }

    if (jobs.length > 0) return jobs;
    throw new Error('Nenhuma vaga capturada via HTTP no GeekHunter');
  }

  private async scrapeViaPlaywright(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrl = 'https://www.geekhunter.com.br/vagas';
    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const cards = await page.$$('.job-card, .vaga-card, [data-testid="job-card"], article');

      for (const card of cards) {
        try {
          const titleEl = await card.$('h2 a, h3 a, .job-title, a[href*="/vagas/"]');
          const companyEl = await card.$('.company-name, .company, .empresa');
          const locationEl = await card.$('.location, .cidade, .job-location');
          const dateEl = await card.$('time, .date, .data');

          const title = titleEl ? (await titleEl.innerText()).trim() : '';
          const href = titleEl ? await titleEl.getAttribute('href') : '';
          const company = companyEl ? (await companyEl.innerText()).trim() : 'GeekHunter Empresa';
          const location = locationEl ? (await locationEl.innerText()).trim() : 'Remoto';
          const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';

          if (!title || !href) continue;

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 7)) continue;

          const fullUrl = href.startsWith('http') ? href : `https://www.geekhunter.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.GEEKHUNTER,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        } catch {}
      }
    } catch (err) {
      console.warn('[GeekHunterScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }
}
