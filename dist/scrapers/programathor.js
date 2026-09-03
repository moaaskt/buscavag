import axios from 'axios';
import { createStealthContext } from './base.js';
import { PlatformSource } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';
export class ProgramathorScraper {
    name = 'Programathor';
    async scrape() {
        // Tenta primeiro via HTTP direto, fallback para Playwright
        try {
            return await this.scrapeViaHttp();
        }
        catch (err) {
            console.warn('[ProgramathorScraper] HTTP falhou, tentando Playwright:', err.message);
            return await this.scrapeViaPlaywright();
        }
    }
    async scrapeViaHttp() {
        const jobs = [];
        const keywords = ['full stack junior', 'fullstack', 'desenvolvedor junior', 'frontend junior', 'backend junior'];
        for (const kw of keywords) {
            try {
                const url = `https://programathor.com.br/jobs/search?query=${encodeURIComponent(kw)}`;
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
                    },
                    timeout: 15000,
                });
                const html = response.data;
                // Regex para extrair cards de vagas do HTML do Programathor
                const cardRegex = /<div[^>]*class="[^"]*cell-list[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
                const titleRegex = /<a[^>]*href="(\/jobs\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
                const companyRegex = /<span[^>]*class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/span>/i;
                const locationRegex = /<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/i;
                const dateRegex = /<span[^>]*class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\/span>/i;
                let match;
                while ((match = cardRegex.exec(html)) !== null) {
                    const block = match[1];
                    const titleMatch = titleRegex.exec(block);
                    const companyMatch = companyRegex.exec(block);
                    const locationMatch = locationRegex.exec(block);
                    const dateMatch = dateRegex.exec(block);
                    if (!titleMatch)
                        continue;
                    const title = this.stripTags(titleMatch[2]).trim();
                    const href = titleMatch[1];
                    const company = companyMatch ? this.stripTags(companyMatch[1]).trim() : 'Programathor';
                    const location = locationMatch ? this.stripTags(locationMatch[1]).trim() : 'Brasil';
                    const dateStr = dateMatch ? this.stripTags(dateMatch[1]).trim() : '';
                    if (!title)
                        continue;
                    const publishedAt = parseRelativeDate(dateStr);
                    if (isOlderThanDays(publishedAt, 5))
                        continue;
                    jobs.push({
                        title,
                        company,
                        platform: PlatformSource.PROGRAMATHOR,
                        url: `https://programathor.com.br${href}`,
                        description: `${title} - ${company}`,
                        publishedAt,
                        location,
                    });
                }
            }
            catch (err) {
                console.warn(`[ProgramathorScraper] HTTP erro para "${kw}":`, err.message);
            }
        }
        if (jobs.length > 0)
            return jobs;
        throw new Error('Nenhuma vaga encontrada via HTTP, tentando Playwright');
    }
    async scrapeViaPlaywright() {
        const jobs = [];
        const searchUrl = 'https://programathor.com.br/jobs?expertise=junior&skills=fullstack';
        const { browser, context, page } = await createStealthContext();
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(3000);
            const cards = await page.$$('.cell-list, .job-card, [class*="card"]');
            for (const card of cards) {
                try {
                    const titleEl = await card.$('a[href*="/jobs/"], h3, .job-title');
                    const companyEl = await card.$('.company-name, .company, [class*="company"]');
                    const locationEl = await card.$('.location, [class*="location"]');
                    const dateEl = await card.$('.date, time, [class*="date"]');
                    const title = titleEl ? (await titleEl.innerText()).trim() : '';
                    const company = companyEl ? (await companyEl.innerText()).trim() : '';
                    const location = locationEl ? (await locationEl.innerText()).trim() : '';
                    const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';
                    const href = titleEl ? await titleEl.getAttribute('href') : '';
                    if (!title || !href)
                        continue;
                    const publishedAt = parseRelativeDate(dateStr);
                    if (isOlderThanDays(publishedAt, 5))
                        continue;
                    const fullUrl = href.startsWith('http') ? href : `https://programathor.com.br${href}`;
                    jobs.push({
                        title,
                        company: company || 'Programathor',
                        platform: PlatformSource.PROGRAMATHOR,
                        url: fullUrl,
                        description: `${title} - ${company || 'Programathor'}`,
                        publishedAt,
                        location: location || 'Brasil',
                    });
                }
                catch {
                    // Ignorar erro individual por card
                }
            }
        }
        catch (err) {
            console.warn('[ProgramathorScraper] Playwright erro:', err.message);
        }
        finally {
            await context.close();
            await browser.close();
        }
        return jobs;
    }
    stripTags(html) {
        return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
    }
}
