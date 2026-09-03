import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class RecrutaSimplesScraper implements JobScraper {
  name = 'Recruta Simples';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = ['desenvolvedor-junior', 'desenvolvedor-full-stack', 'programador'];

    for (const slug of searchSlugs) {
      try {
        const url = `https://www.recrutasimples.com.br/vagas/${slug}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.job-item, .card-vaga, article, [class*="job-card"], .vacancy').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .job-title a, a[href*="/vagas/"]');
          const companyEl = $(el).find('.company-name, .company, [class*="company"]');
          const locationEl = $(el).find('.job-location, .location, [class*="location"]');
          const dateEl = $(el).find('time, .date, [class*="date"]');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Recruta Simples Partner';
          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

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
        console.warn(`[RecrutaSimplesScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
