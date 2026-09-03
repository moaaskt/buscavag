import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class PandapeScraper implements JobScraper {
  name = 'PandaPé ATS (GTO RH)';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const targetUrls = [
      'https://gtorh.pandape.infojobs.com.br/',
    ];

    for (const url of targetUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('[class*="vacancy"], [class*="vaga"], [class*="job"], article, .card').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, [class*="title"] a, a[href*="/vaga/"], a[href*="/detail/"]');
          const locationEl = $(el).find('[class*="location"], [class*="city"], [class*="local"]');
          const dateEl = $(el).find('time, [class*="date"], .data');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href || href === '#' || href.startsWith('javascript')) return;

          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://gtorh.pandape.infojobs.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company: 'GTO RH / PandaPé',
            platform: PlatformSource.PANDAPE,
            url: fullUrl,
            description: `${title} - GTO RH PandaPé (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[PandapeScraper] Aviso ao buscar "${url}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
