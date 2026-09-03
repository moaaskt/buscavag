import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class BebeeScraper implements JobScraper {
  name = 'beBee';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = ['desenvolvedor-junior', 'full-stack', 'programador'];

    for (const slug of searchSlugs) {
      try {
        const url = `https://br.bebee.com/vagas-de-emprego/${slug}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.job-item, .item-job, article, [class*="job-card"], .card-job').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .job-title a, a[href*="/job/"]');
          const companyEl = $(el).find('.job-company, .company, [class*="company"]');
          const locationEl = $(el).find('.job-location, .location, [class*="location"]');
          const dateEl = $(el).find('.job-date, time, .date, [class*="date"]');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'beBee Partner';
          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://br.bebee.com${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.BEBEE,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[BebeeScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
