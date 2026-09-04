import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class InfojobsScraper implements JobScraper {
  name = 'Infojobs';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchSlugs = [
      'vagas-de-desenvolvedor-junior',
      'vagas-de-desenvolvedor-full-stack',
      'vagas-de-programador-junior',
    ];

    for (const slug of searchSlugs) {
      try {
        const url = `https://www.infojobs.com.br/${slug}.aspx`;
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        $('[data-id], .element-vaga, .js_vacancyCard, .card, article').each((_, el) => {
          const titleEl = $(el).find('h2 a, .js_cardTitle, [data-href*="/vaga-de-"]');
          const companyEl = $(el).find('.text-body-sm, .company, [class*="company"]');
          const locationEl = $(el).find('.location, [class*="location"], [class*="city"]');
          const dateEl = $(el).find('.date, .small, time, [class*="date"]');

          const title = titleEl.text().trim();
          let href = titleEl.attr('href') || titleEl.attr('data-href') || $(el).find('a').attr('href') || '';
          if (!title || !href) return;

          const company = companyEl.text().trim() || 'Infojobs Partner';
          const location = locationEl.text().trim() || 'Brasil';
          const dateStr = dateEl.text().trim();

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://www.infojobs.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.INFOJOBS,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt,
            location,
          });
        });
      } catch (err) {
        console.warn(`[InfojobsScraper] Aviso ao buscar "${slug}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
