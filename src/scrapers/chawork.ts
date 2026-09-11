import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class ChaworkScraper implements JobScraper {
  name = 'Chawork';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = ['desenvolvedor', 'programador', 'fullstack', 'junior'];

    for (const slug of searchSlugs) {
      try {
        const url = `https://chawork.com.br/vagas/?q=${encodeURIComponent(slug)}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.job-card, .vaga-card, article, .item-vaga, .job-listing').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .job-title a, .title a, a[href*="/vaga/"]');
          const companyEl = $(el).find('.company, .empresa, .job-company');
          const locationEl = $(el).find('.location, .cidade, .job-location');
          const dateEl = $(el).find('time, .date, .data, .published');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Chawork';
          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://chawork.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.CHAWORK,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[ChaworkScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
