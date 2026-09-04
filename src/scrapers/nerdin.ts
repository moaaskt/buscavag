import * as cheerio from 'cheerio';
import { fetchHtml, createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class NerdinScraper implements JobScraper {
  name = 'Nerdin';

  async scrape(): Promise<RawJob[]> {
    try {
      return await this.scrapeViaHttp();
    } catch (err) {
      console.warn('[NerdinScraper] HTTP falhou, tentando Playwright:', (err as Error).message);
      return await this.scrapeViaPlaywright();
    }
  }

  private async scrapeViaHttp(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrls = [
      'https://nerdin.com.br/vagas',
      'https://nerdin.com.br/vagas?tipo=programador',
      'https://nerdin.com.br/vagas?cidade=Florian%C3%B3polis',
    ];

    for (const url of searchUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.vaga-item, .card-vaga, .item-vaga, article, .box-vaga').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .titulo-vaga a, a[href*="/vaga/"], a[href*="/oportunidade/"]');
          const companyEl = $(el).find('.empresa, .company, .nome-empresa');
          const locationEl = $(el).find('.cidade, .local, .localizacao, .badge-local');
          const dateEl = $(el).find('time, .data, .date, .publicado');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Empresa Nerdin';
          const location = locationEl.text().trim() || 'Florianópolis / SC';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 7)) return;

          const fullUrl = href.startsWith('http') ? href : `https://nerdin.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.NERDIN,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[NerdinScraper] Aviso para "${url}":`, (err as Error).message);
      }
    }

    if (jobs.length > 0) return jobs;
    throw new Error('Nenhuma vaga capturada via HTTP no Nerdin');
  }

  private async scrapeViaPlaywright(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrl = 'https://nerdin.com.br/vagas';
    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const cards = await page.$$('.vaga-item, .card-vaga, .item-vaga, article, .box-vaga');

      for (const card of cards) {
        try {
          const titleEl = await card.$('h2 a, h3 a, .titulo-vaga a, a[href*="/vaga/"], a[href*="/oportunidade/"]');
          const companyEl = await card.$('.empresa, .company, .nome-empresa');
          const locationEl = await card.$('.cidade, .local, .localizacao');
          const dateEl = await card.$('time, .data, .date');

          const title = titleEl ? (await titleEl.innerText()).trim() : '';
          const href = titleEl ? await titleEl.getAttribute('href') : '';
          const company = companyEl ? (await companyEl.innerText()).trim() : 'Empresa Nerdin';
          const location = locationEl ? (await locationEl.innerText()).trim() : 'Florianópolis / SC';
          const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';

          if (!title || !href) continue;

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 7)) continue;

          const fullUrl = href.startsWith('http') ? href : `https://nerdin.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.NERDIN,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        } catch {}
      }
    } catch (err) {
      console.warn('[NerdinScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }
}
