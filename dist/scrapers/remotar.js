import axios from 'axios';
import { createStealthContext } from './base.js';
import { PlatformSource } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';
export class RemotarScraper {
    name = 'Remotar';
    async scrape() {
        // Tenta primeiro via HTTP direto, fallback para Playwright
        try {
            return await this.scrapeViaHttp();
        }
        catch (err) {
            console.warn('[RemotarScraper] HTTP falhou, tentando Playwright:', err.message);
            return await this.scrapeViaPlaywright();
        }
    }
    async scrapeViaHttp() {
        const jobs = [];
        const categories = ['desenvolvimento', 'tecnologia'];
        for (const category of categories) {
            try {
                const url = `https://remotar.com.br/vagas/${category}`;
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
                    },
                    timeout: 15000,
                });
                const html = response.data;
                // Extrair vagas do HTML
                const jobLinkRegex = /<a[^>]*href="(\/vaga[s]?\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
                const titleRegex = /<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/i;
                const companyRegex = /<(?:span|p|div)[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/(?:span|p|div)>/i;
                const dateRegex = /<(?:span|time|div)[^>]*(?:class="[^"]*date[^"]*"|datetime)[^>]*>([\s\S]*?)<\/(?:span|time|div)>/i;
                // Busca de blocos de vagas
                const cardRegex = /<(?:article|div|li)[^>]*class="[^"]*(?:job|vaga|card)[^"]*"[^>]*>([\s\S]*?)<\/(?:article|div|li)>/gi;
                let match;
                while ((match = cardRegex.exec(html)) !== null) {
                    const block = match[1];
                    const linkMatch = /<a[^>]*href="(\/vaga[s]?\/[^"]+)"[^>]*>/i.exec(block);
                    const titleMatch = titleRegex.exec(block);
                    const companyMatch = companyRegex.exec(block);
                    const dateMatch = dateRegex.exec(block);
                    const href = linkMatch ? linkMatch[1] : '';
                    const title = titleMatch ? this.stripTags(titleMatch[1]).trim() : '';
                    const company = companyMatch ? this.stripTags(companyMatch[1]).trim() : 'Remotar';
                    const dateStr = dateMatch ? this.stripTags(dateMatch[1]).trim() : '';
                    if (!title || !href)
                        continue;
                    const publishedAt = parseRelativeDate(dateStr);
                    if (isOlderThanDays(publishedAt, 5))
                        continue;
                    jobs.push({
                        title,
                        company,
                        platform: PlatformSource.REMOTAR,
                        url: `https://remotar.com.br${href}`,
                        description: `${title} - ${company} (Remoto)`,
                        publishedAt,
                        location: 'Remoto',
                    });
                }
            }
            catch (err) {
                console.warn(`[RemotarScraper] HTTP erro para "${category}":`, err.message);
            }
        }
        if (jobs.length > 0)
            return jobs;
        throw new Error('Nenhuma vaga encontrada via HTTP, tentando Playwright');
    }
    async scrapeViaPlaywright() {
        const jobs = [];
        const searchUrl = 'https://remotar.com.br/vagas/desenvolvimento';
        const { browser, context, page } = await createStealthContext();
        try {
            await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(4000);
            const cards = await page.$$('article, [class*="job"], [class*="vaga"], [class*="card"]');
            for (const card of cards) {
                try {
                    const titleEl = await card.$('h2, h3, a[href*="/vaga"], [class*="title"]');
                    const companyEl = await card.$('[class*="company"], [class*="empresa"]');
                    const linkEl = await card.$('a[href*="/vaga"]');
                    const dateEl = await card.$('time, [class*="date"], [class*="data"]');
                    const title = titleEl ? (await titleEl.innerText()).trim() : '';
                    const company = companyEl ? (await companyEl.innerText()).trim() : '';
                    const href = linkEl ? await linkEl.getAttribute('href') : '';
                    const dateStr = dateEl ? (await dateEl.innerText()).trim() : '';
                    if (!title)
                        continue;
                    const publishedAt = parseRelativeDate(dateStr);
                    if (isOlderThanDays(publishedAt, 5))
                        continue;
                    const fullUrl = href
                        ? (href.startsWith('http') ? href : `https://remotar.com.br${href}`)
                        : `https://remotar.com.br/vagas/desenvolvimento`;
                    jobs.push({
                        title,
                        company: company || 'Remotar',
                        platform: PlatformSource.REMOTAR,
                        url: fullUrl,
                        description: `${title} - ${company || 'Empresa remota'}`,
                        publishedAt,
                        location: 'Remoto',
                    });
                }
                catch {
                    // Ignorar erro individual por card
                }
            }
        }
        catch (err) {
            console.warn('[RemotarScraper] Playwright erro:', err.message);
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
