import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class RecrutaSimplesScraper implements JobScraper {
  name = 'Recruta Simples';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchTerms = ['desenvolvedor', 'programador', 'full stack', 'junior'];
    const seenUrls = new Set<string>();

    for (const term of searchTerms) {
      try {
        const url = `https://www.recrutasimples.com.br/vagas?q=${encodeURIComponent(term)}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('a[href^="/vaga/"]').each((_, el) => {
          const title = $(el).text().replace(/\s+/g, ' ').trim();
          let href = $(el).attr('href') || '';
          if (!title || !href || seenUrls.has(href)) return;

          // Localizar o card pai
          let cardEl = $(el).parent();
          for (let i = 0; i < 4; i++) {
            if (cardEl.find('a[href^="/vagas/e/"]').length > 0 || cardEl.find('a[href^="/vagas/"]').length > 1) {
              break;
            }
            if (cardEl.parent().length) {
              cardEl = cardEl.parent();
            }
          }

          const company = cardEl.find('a[href^="/vagas/e/"]').first().text().trim() || 'Recruta Simples Partner';
          const location = cardEl.find('a[href^="/vagas/"]:not([href^="/vagas/e/"])').first().text().trim() || 'Brasil';
          const dateEl = cardEl.find('time, .date, [class*="date"]');
          const dateStr = dateEl.text().trim();

          const publishedAt = dateStr ? parseRelativeDate(dateStr) : new Date();
          if (isOlderThanDays(publishedAt, 5)) return;

          seenUrls.add(href);
          const fullUrl = href.startsWith('http') ? href : `https://www.recrutasimples.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.RECRUTA_SIMPLES,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[RecrutaSimplesScraper] Aviso ao buscar termo "${term}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
