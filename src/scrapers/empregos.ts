import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class EmpregosScraper implements JobScraper {
  name = 'Empregos.com.br';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = [
      'desenvolvedor-junior',
      'desenvolvedor-full-stack',
      'programador-junior',
    ];

    for (const slug of searchSlugs) {
      try {
        const url = `https://www.empregos.com.br/vagas/${slug}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.item-vaga, .card-vaga, article, [class*="item-list"], .vacancy-item').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .title a, a[href*="/vagas/"]');
          const companyEl = $(el).find('.nome-empresa, .company, [class*="company"]');
          const locationEl = $(el).find('.cidade, .location, [class*="location"]');
          const dateEl = $(el).find('.data, time, [class*="date"]');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Empregos.com.br Partner';
          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://www.empregos.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.EMPREGOS,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[EmpregosScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
