import { createStealthContext } from './base.js';
import { PlatformSource } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';
export class GoogleJobsScraper {
    name = 'Google Jobs';
    async scrape() {
        const jobs = [];
        const searchUrl = 'https://www.google.com/search?q=vagas+desenvolvedor+full+stack+junior&ibp=htl;jobs';
        const { browser, context, page } = await createStealthContext();
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(3000);
            const jobListItems = await page.$$('[role="listitem"], .iR1T8b');
            for (const item of jobListItems) {
                try {
                    const titleEl = await item.$('.BjA41b, .P822W, [role="heading"]');
                    const companyEl = await item.$('.vL2fd, .nCinv');
                    const locationEl = await item.$('.Qk80Jf');
                    const dateEl = await item.$('.LL4d2b, .k0v3pd');
                    const title = titleEl ? (await titleEl.innerText()).trim() : '';
                    const company = companyEl ? (await companyEl.innerText()).trim() : '';
                    const location = locationEl ? (await locationEl.innerText()).trim() : '';
                    const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';
                    if (!title || !company)
                        continue;
                    const publishedAt = parseRelativeDate(dateStr);
                    if (isOlderThanDays(publishedAt, 5))
                        continue;
                    jobs.push({
                        title,
                        company,
                        platform: PlatformSource.GOOGLE_JOBS,
                        url: `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + company)}&ibp=htl;jobs`,
                        description: `${title} na ${company} - Google Jobs`,
                        publishedAt,
                        location,
                    });
                }
                catch {
                    // Ignorar erros em itens individuais
                }
            }
        }
        catch (err) {
            console.warn('[GoogleJobsScraper] Erro na navegação:', err.message);
        }
        finally {
            await context.close();
            await browser.close();
        }
        return jobs;
    }
}
