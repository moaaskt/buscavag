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

        $('a[href*="/Detail/"], a[href*="/detail/"], [class*="card-vacancy"]').each((_, el) => {
          const isAnchor = $(el).is('a');
          const anchorEl = isAnchor ? $(el) : $(el).find('a[href*="/Detail/"], a[href*="/detail/"]').first();
          
          let href = anchorEl.attr('href') || $(el).attr('href') || '';
          if (!href || href === '#' || href.startsWith('javascript')) return;

          const title = anchorEl.find('h3, h2, [class*="title"]').text().trim() || anchorEl.attr('title') || $(el).find('h3, h2').text().trim();
          if (!title) return;

          // Localização
          let location = $(el).find('.vacancy-detail .align-middle').first().text().replace(/\s+/g, ' ').trim();
          if (!location || location.length > 50) {
            const matchLoc = $(el).text().match(/([A-Za-zÀ-ÖØ-öø-ÿ\s]+ - [A-Z]{2})/);
            location = matchLoc ? matchLoc[1].trim() : 'Brasil';
          }

          // Data
          const dateText = $(el).find('.vacancy-date, time, [class*="date"]').text().trim();
          const publishedAt = dateText ? parseRelativeDate(dateText) : new Date();

          if (isOlderThanDays(publishedAt, 5)) return;

          const fullUrl = href.startsWith('http') ? href : `https://gtorh.pandape.infojobs.com.br${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company: 'GTO RH / PandaPé',
            platform: PlatformSource.PANDAPE,
            url: fullUrl,
            description: `${title} - GTO RH PandaPé (${location})`,
            publishedAt,
            location: location || 'Brasil',
          });
        });
      } catch (err) {
        console.warn(`[PandapeScraper] Aviso ao buscar "${url}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
