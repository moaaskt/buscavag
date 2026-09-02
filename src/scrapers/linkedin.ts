import { createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class LinkedInScraper implements JobScraper {
  name = 'LinkedIn';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrl = 'https://www.linkedin.com/jobs/search?keywords=Full%20Stack%20Junior&location=Brasil&f_TPR=r604800'; // r604800 = 1 semana

    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      const jobCards = await page.$$('.jobs-search__results-list li, .job-search-card');

      for (const card of jobCards) {
        try {
          const titleEl = await card.$('.base-search-card__title, .job-search-card__title');
          const companyEl = await card.$('.base-search-card__subtitle, .job-search-card__company-name');
          const locationEl = await card.$('.job-search-card__location');
          const linkEl = await card.$('a.base-card__full-link, a.job-search-card__link');
          const timeEl = await card.$('time');

          const title = titleEl ? (await titleEl.innerText()).trim() : '';
          const company = companyEl ? (await companyEl.innerText()).trim() : '';
          const location = locationEl ? (await locationEl.innerText()).trim() : '';
          const url = linkEl ? await linkEl.getAttribute('href') : '';
          const timeStr = timeEl ? await timeEl.getAttribute('datetime') || (await timeEl.innerText()) : '';

          if (!title || !url) continue;

          const publishedAt = parseRelativeDate(timeStr);
          if (isOlderThanDays(publishedAt, 5)) continue;

          jobs.push({
            title,
            company,
            platform: PlatformSource.LINKEDIN,
            url: url.split('?')[0],
            description: `${title} na empresa ${company}`,
            publishedAt,
            location,
          });
        } catch {
          // Ignorar erros individuais por card
        }
      }
    } catch (err) {
      console.warn('[LinkedInScraper] Erro na navegação:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }
}
