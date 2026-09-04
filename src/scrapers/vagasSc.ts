import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class VagasScScraper implements JobScraper {
  name = 'Vagas SC';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = ['desenvolvedor', 'programador', 'full-stack', 'ti'];

    for (const slug of searchSlugs) {
      try {
        const url = `https://vagas.sc/?s=${encodeURIComponent(slug)}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('article, .job-listing, .post, .vaga-item, .listing-item').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .entry-title a, .job-title a, a[rel="bookmark"]');
          const companyEl = $(el).find('.company, .empresa, .job-company, .author');
          const locationEl = $(el).find('.location, .cidade, .job-location, .entry-meta-location');
          const dateEl = $(el).find('time, .date, .entry-date, .published, .job-date');

          const title = titleEl.text().trim();
          const href = titleEl.attr('href');
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Vagas SC';
          const location = locationEl.text().trim() || 'Santa Catarina';
          const dateStr = dateEl.text().trim() || dateEl.attr('datetime') || '';

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          jobs.push({
            title,
            company,
            platform: PlatformSource.VAGAS_SC,
            url: href.startsWith('http') ? href : `https://vagas.sc${href}`,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[VagasScScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
