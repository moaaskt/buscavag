import * as cheerio from 'cheerio';
import { fetchHtml, createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class TramposScraper implements JobScraper {
  name = 'Trampos.co';

  async scrape(): Promise<RawJob[]> {
    try {
      return await this.scrapeViaHttp();
    } catch (err) {
      console.warn('[TramposScraper] HTTP falhou, tentando Playwright:', (err as Error).message);
      return await this.scrapeViaPlaywright();
    }
  }

  private async scrapeViaHttp(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrls = [
      'https://trampos.co/oportunidades?tp=tecnologia',
      'https://trampos.co/oportunidades?q=desenvolvedor',
      'https://trampos.co/oportunidades?q=junior',
    ];

    for (const url of searchUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.opportunity, .job-item, .card-opportunity, article, [data-opportunity-id]').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .title a, a[href*="/oportunidades/"]');
          const companyEl = $(el).find('.company, .empresa, .employer');
          const locationEl = $(el).find('.location, .cidade, .city');
          const dateEl = $(el).find('time, .date, .posted-at');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Trampos.co';
          const location = locationEl.text().trim() || 'Remoto / Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 7)) return;

          const fullUrl = href.startsWith('http') ? href : `https://trampos.co${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.TRAMPOS,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[TramposScraper] Aviso para "${url}":`, (err as Error).message);
      }
    }

    if (jobs.length > 0) return jobs;
    throw new Error('Nenhuma vaga capturada via HTTP no Trampos.co');
  }

  private async scrapeViaPlaywright(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrl = 'https://trampos.co/oportunidades?tp=tecnologia';
    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const cards = await page.$$('.opportunity, .job-item, .card-opportunity, article');

      for (const card of cards) {
        try {
          const titleEl = await card.$('h2 a, h3 a, .title a, a[href*="/oportunidades/"]');
          const companyEl = await card.$('.company, .empresa');
          const locationEl = await card.$('.location, .cidade');
          const dateEl = await card.$('time, .date');

          const title = titleEl ? (await titleEl.innerText()).trim() : '';
          const href = titleEl ? await titleEl.getAttribute('href') : '';
          const company = companyEl ? (await companyEl.innerText()).trim() : 'Trampos.co';
          const location = locationEl ? (await locationEl.innerText()).trim() : 'Remoto / Brasil';
          const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';

          if (!title || !href) continue;

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 7)) continue;

          const fullUrl = href.startsWith('http') ? href : `https://trampos.co${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.TRAMPOS,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        } catch {}
      }
    } catch (err) {
      console.warn('[TramposScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }
}
