import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class BneScraper implements JobScraper {
  name = 'BNE';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = ['desenvolvedor', 'programador', 'full-stack', 'ti'];

    for (const slug of searchSlugs) {
      try {
        const url = `https://www.bne.com.br/vagas-de-emprego-para-${slug}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.job-item, .vaga, article, [class*="job-card"], .job').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .title a, a[href*="/vaga-de-emprego/"]');
          const companyEl = $(el).find('.company, .empresa, [class*="company"]');
          const locationEl = $(el).find('.location, .cidade, [class*="location"]');
          const dateEl = $(el).find('.date, time, [class*="date"]');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'BNE Empregos';
          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://www.bne.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.BNE,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[BneScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
