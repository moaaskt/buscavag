import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class QuickinScraper implements JobScraper {
  name = 'Quickin ATS';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const targetUrls = [
      'https://jobs.quickin.io/anarecrutamento',
    ];

    for (const url of targetUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('[class*="job"], [class*="vaga"], .card, article, a[href*="/vaga/"], a[href*="/position/"]').each((_, el) => {
          const isLink = $(el).is('a');
          const linkEl = isLink ? $(el) : $(el).find('a');
          const titleEl = $(el).find('h2, h3, [class*="title"], [class*="name"]');
          
          let title = titleEl.text().trim();
          if (!title && isLink) {
            title = $(el).text().trim();
          }

          let href = linkEl.attr('href') || (isLink ? $(el).attr('href') : '') || '';
          if (!title || !href || href === '#' || href.startsWith('javascript')) return;

          const locationEl = $(el).find('[class*="location"], [class*="city"], [class*="badge"]');
          const location = locationEl.text().trim() || 'Brasil';

          const publishedAt = new Date();
          const fullUrl = href.startsWith('http') ? href : `https://jobs.quickin.io${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company: 'Quickin Partner (Ana Recrutamento)',
            platform: PlatformSource.QUICKIN,
            url: fullUrl,
            description: `${title} - Quickin Partner (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[QuickinScraper] Aviso ao buscar "${url}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
