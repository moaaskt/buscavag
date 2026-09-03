import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class TrabalhaBrasilScraper implements JobScraper {
  name = 'Trabalha Brasil';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = [
      'vagas-para-desenvolvedor-junior',
      'vagas-para-desenvolvedor-full-stack',
      'vagas-para-programador-junior',
    ];

    for (const slug of searchSlugs) {
      try {
        const url = `https://www.trabalhabrasil.com.br/vagas-empregos/${slug}`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('.job__vacancy, .jg__job, [class*="job-item"], article, .vacancy-card').each((_, el) => {
          const titleEl = $(el).find('h2 a, h3 a, .job__vacancy__title, a[href*="/vagas-empregos/"]');
          const companyEl = $(el).find('.job__vacancy__company, .company, [class*="company"]');
          const locationEl = $(el).find('.job__vacancy__location, .location, [class*="location"]');
          const descEl = $(el).find('.job__vacancy__description, p, [class*="desc"]');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Trabalha Brasil Partner';
          const location = locationEl.text().trim() || 'Brasil';
          const description = descEl.text().trim() || `${title} - ${company}`;

          const publishedAt = new Date();

          const fullUrl = href.startsWith('http') ? href : `https://www.trabalhabrasil.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.TRABALHA_BRASIL,
            url: fullUrl,
            description: `${title} - ${description}`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[TrabalhaBrasilScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
