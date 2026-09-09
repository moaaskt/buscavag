import * as cheerio from 'cheerio';
import { fetchHtml, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class QuickinScraper implements JobScraper {
  name = 'Quickin ATS';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const targetUrls = [
      'https://jobs.quickin.io/anarecrutamento/jobs',
    ];

    for (const url of targetUrls) {
      try {
        const html = await fetchHtml(url);
        const $ = cheerio.load(html);

        // 1. Tentar extrair do objeto __NUXT__ embutido no HTML
        const scriptContent = $('script').filter((_, el) => ($(el).html() || '').includes('window.__NUXT__')).html();
        if (scriptContent) {
          const match = scriptContent.match(/window\.__NUXT__\s*=\s*(.*);/s);
          if (match) {
            try {
              const nuxtData = eval(match[1]);
              const docList = nuxtData?.data?.[0]?.jobs?.docs || [];
              for (const item of docList) {
                const title = item.title?.trim();
                const jobUrl = item.career_url || (item._id ? `https://jobs.quickin.io/anarecrutamento/jobs/${item._id}` : '');
                if (!title || !jobUrl) continue;

                const publishedAt = item.created_at ? new Date(item.created_at) : new Date();
                if (isOlderThanDays(publishedAt, 5)) continue;

                let location = 'Brasil';
                if (item.workplace_type === 'remote') {
                  location = 'Remoto';
                } else if (item.city) {
                  location = item.region ? `${item.city} - ${item.region}` : item.city;
                }

                jobs.push({
                  title,
                  company: 'Ana Recrutamento / Quickin',
                  platform: PlatformSource.QUICKIN,
                  url: jobUrl,
                  description: item.description?.replace(/<[^>]*>?/gm, ' ').substring(0, 300) || `${title} - Quickin (${location})`,
                  publishedAt,
                  location,
                });
              }

              if (jobs.length > 0) {
                continue;
              }
            } catch (evalErr) {
              console.warn(`[QuickinScraper] Erro ao processar __NUXT__:`, (evalErr as Error).message);
            }
          }
        }

        // 2. Fallback via seletores DOM
        $('a[href*="/jobs/"], a[href*="/position/"], [class*="job-card"]').each((_, el) => {
          const isLink = $(el).is('a');
          const linkEl = isLink ? $(el) : $(el).find('a').first();
          const title = $(el).find('h2, h3, [class*="title"]').text().trim() || linkEl.text().trim();
          let href = linkEl.attr('href') || $(el).attr('href') || '';
          if (!title || !href || href === '#' || href.startsWith('javascript')) return;

          const locationEl = $(el).find('[class*="location"], [class*="city"], [class*="badge"]');
          const location = locationEl.text().trim() || 'Brasil';
          const fullUrl = href.startsWith('http') ? href : `https://jobs.quickin.io${href.startsWith('/') ? '' : '/'}${href}`;

          jobs.push({
            title,
            company: 'Ana Recrutamento / Quickin',
            platform: PlatformSource.QUICKIN,
            url: fullUrl,
            description: `${title} - Quickin (${location})`,
            publishedAt: new Date(),
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
