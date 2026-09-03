import { createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class GlassdoorScraper implements JobScraper {
  name = 'Glassdoor';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrl = 'https://www.glassdoor.com.br/Vaga/brasil-desenvolvedor-junior-vagas-SRCH_IL.0,6_IN36_KO7,27.htm';

    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      // Fechar modais de login ou cookie consent que o Glassdoor frequentemente exibe
      await this.dismissModals(page);

      // Cards de vagas no Glassdoor
      const cards = await page.$$('[data-test="jobListing"], .react-job-listing, li[data-id], [class*="JobsList"] li, .job-search-result');

      for (const card of cards) {
        try {
          const titleEl = await card.$('[data-test="job-title"], .job-title, a[data-test="job-link"], h2, h3');
          const companyEl = await card.$('[data-test="emp-name"], .employer-name, [class*="employer"], [class*="company"]');
          const locationEl = await card.$('[data-test="emp-location"], .location, [class*="location"]');
          const linkEl = await card.$('a[href*="/Vaga/"], a[href*="/job-listing/"], a[data-test="job-link"]');
          const dateEl = await card.$('[data-test="job-age"], .listing-age, [class*="listingAge"], [class*="date"]');

          const title = titleEl ? (await titleEl.innerText()).trim() : '';
          const company = companyEl ? (await companyEl.innerText()).trim() : '';
          const location = locationEl ? (await locationEl.innerText()).trim() : '';
          const href = linkEl ? await linkEl.getAttribute('href') : '';
          const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';

          if (!title) continue;

          const publishedAt = parseRelativeDate(dateStr);
          if (isOlderThanDays(publishedAt, 5)) continue;

          const fullUrl = href
            ? (href.startsWith('http') ? href : `https://www.glassdoor.com.br${href}`)
            : searchUrl;

          jobs.push({
            title,
            company: company || 'Glassdoor',
            platform: PlatformSource.GLASSDOOR,
            url: fullUrl,
            description: `${title} - ${company || 'Empresa Glassdoor'}`,
            publishedAt,
            location: location || 'Brasil',
          });
        } catch {
          // Ignorar erro individual por card
        }
      }
    } catch (err) {
      console.warn('[GlassdoorScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }

  /**
   * Tenta fechar modais/popups de login e cookies que o Glassdoor frequentemente exibe.
   */
  private async dismissModals(page: import('playwright').Page): Promise<void> {
    const modalSelectors = [
      // Botão de fechar modal de login
      'button[class*="CloseButton"]',
      '[data-test="close-button"]',
      'button[aria-label="Close"]',
      'button[aria-label="Fechar"]',
      '.modal-close',
      // Cookie consent
      '#onetrust-accept-btn-handler',
      '[data-test="cookie-accept"]',
      'button[id*="accept"]',
    ];

    for (const selector of modalSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      } catch {
        // Nenhum modal encontrado para este seletor
      }
    }
  }
}
