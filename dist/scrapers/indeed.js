import { createStealthContext } from './base.js';
import { PlatformSource } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';
export class IndeedScraper {
    name = 'Indeed';
    async scrape() {
        const jobs = [];
        const searchUrl = 'https://br.indeed.com/jobs?q=full+stack+junior&fromage=5';
        const { browser, context, page } = await createStealthContext();
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(3000);
            const cards = await page.$$('.job_seen_beacon, .resultContent');
            for (const card of cards) {
                try {
                    const titleEl = await card.$('h2.jobTitle span, a.jcs-JobTitle');
                    const companyEl = await card.$('[data-testid="company-name"], .companyName');
                    const locationEl = await card.$('[data-testid="text-location"], .companyLocation');
                    const linkEl = await card.$('a.jcs-JobTitle');
                    const dateEl = await card.$('.date, [data-testid="myJobsStateDate"]');
                    const title = titleEl ? (await titleEl.innerText()).trim() : '';
                    const company = companyEl ? (await companyEl.innerText()).trim() : '';
                    const location = locationEl ? (await locationEl.innerText()).trim() : '';
                    const href = linkEl ? await linkEl.getAttribute('href') : '';
                    const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';
                    if (!title || !href)
                        continue;
                    const url = href.startsWith('http') ? href : `https://br.indeed.com${href}`;
                    const publishedAt = parseRelativeDate(dateStr);
                    if (isOlderThanDays(publishedAt, 5))
                        continue;
                    jobs.push({
                        title,
                        company,
                        platform: PlatformSource.INDEED,
                        url: url.split('&')[0],
                        description: `${title} - ${company}`,
                        publishedAt,
                        location,
                    });
                }
                catch {
                    // Ignorar erros em card único
                }
            }
        }
        catch (err) {
            console.warn('[IndeedScraper] Erro na navegação:', err.message);
        }
        finally {
            await context.close();
            await browser.close();
        }
        return jobs;
    }
}
