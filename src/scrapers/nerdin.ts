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
      'https://nerdin.com.br/vagas.php',
      'https://nerdin.com.br/vagas-home-office.php',
      'https://nerdin.com.br/vagas-desenvolvedor-sistemas.php',
      'https://nerdin.com.br/vagas-estagio-junior.php',
    ];
    const seenUrls = new Set<string>();

    for (const url of searchUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.vaga-card').each((_, el) => {
          const linkEl = $(el).find('a[href*="vaga_emprego/"], a[href*="vaga-"]').first();
          let href = linkEl.attr('href') || '';
          if (!href || href === '#' || seenUrls.has(href)) return;

          const rawTitle = $(el).find('h1, h2, h3, h4, h5, [class*="title"]').text().trim();
          const lines = $(el).text().split('\n').map(s => s.trim()).filter(Boolean);
          
          let title = rawTitle || lines[0] || '';
          title = title.replace(/\s*Nova\s*$/i, '').replace(/\s+/g, ' ').trim();
          if (!title || title.length < 3 || title.toLowerCase() === 'quero essa vaga') return;

          const cardText = $(el).text().replace(/\s+/g, ' ');
          const company = lines[3] && !lines[3].includes('•') && !lines[3].includes('R$') && !lines[3].includes('Home') ? lines[3] : 'Empresa Nerdin';

          let location = 'Florianópolis / SC';
          if (cardText.includes('Home Office') || cardText.includes('Remoto')) {
            location = 'Remoto / Home Office';
          } else {
            const matchLoc = cardText.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s]+ • [A-Z]{2})/);
            if (matchLoc) {
              location = matchLoc[1].replace('•', '-');
            }
          }

          seenUrls.add(href);
          const fullUrl = href.startsWith('http') ? href : `https://nerdin.com.br/${href.replace(/^\.?\//, '')}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.NERDIN,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt: new Date(),
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
