import axios from 'axios';
import { createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class ProgramathorScraper implements JobScraper {
  name = 'Programathor';

  async scrape(): Promise<RawJob[]> {
    // Tenta primeiro via HTTP direto, fallback para Playwright
    try {
      return await this.scrapeViaHttp();
    } catch (err) {
      console.warn('[ProgramathorScraper] HTTP falhou, tentando Playwright:', (err as Error).message);
      return await this.scrapeViaPlaywright();
    }
  }

  private async scrapeViaHttp(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const urls = [
      'https://programathor.com.br/jobs',
      'https://programathor.com.br/jobs?q=full+stack',
      'https://programathor.com.br/jobs?q=react',
      'https://programathor.com.br/jobs?q=node',
    ];
    const seenUrls = new Set<string>();

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
          },
          timeout: 15000,
        });

        const html: string = response.data;
        // Cards do Programathor possuem links para /jobs/ID-slug
        const linkRegex = /<a[^>]+href="(\/jobs\/\d+-[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;

        while ((match = linkRegex.exec(html)) !== null) {
          const href = match[1];
          const inner = match[2];
          if (seenUrls.has(href)) continue;

          // Extrair título
          const titleMatch = inner.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || inner.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
          let title = titleMatch ? this.stripTags(titleMatch[1]) : this.stripTags(inner).split('\n')[0];
          title = title.replace(/^📍[^\n]+\s*/i, '').trim();
          if (!title || title.length < 3) continue;

          // Empresa e Localização no texto do card
          const cleanText = this.stripTags(inner).replace(/\s+/g, ' ');
          const companyMatch = inner.match(/<span[^>]*class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\/span>/i);
          const company = companyMatch ? this.stripTags(companyMatch[1]).trim() : 'Programathor Partner';

          let location = 'Brasil';
          if (cleanText.includes('Remoto')) {
            location = 'Remoto';
          } else if (cleanText.includes('Presencial') || cleanText.includes('Híbrido')) {
            const locMatch = cleanText.match(/([A-Za-zÀ-ÖØ-öø-ÿ\s]+(?:\/[A-Z]{2})?\s*\((?:Presencial|Híbrido)\))/);
            if (locMatch) location = locMatch[1];
          }

          seenUrls.add(href);
          const fullUrl = `https://programathor.com.br${href}`;

          jobs.push({
            title,
            company,
            platform: PlatformSource.PROGRAMATHOR,
            url: fullUrl,
            description: `${title} - ${company} (${location})`,
            publishedAt: new Date(),
            location,
          });
        }
      } catch (err) {
        console.warn(`[ProgramathorScraper] HTTP erro para "${url}":`, (err as Error).message);
      }
    }

    if (jobs.length > 0) return jobs;
    throw new Error('Nenhuma vaga encontrada via HTTP, tentando Playwright');
  }

  private async scrapeViaPlaywright(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchUrl = 'https://programathor.com.br/jobs';
    const { browser, context, page } = await createStealthContext();

    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);

      const jobLinks = await page.$$eval('a[href*="/jobs/"]', (els) => {
        return els.map(e => {
          const href = (e as HTMLAnchorElement).href;
          const text = (e as HTMLElement).innerText.replace(/^📍[^\n]+\s*/i, '').trim();
          const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
          return {
            href,
            title: lines[0] || '',
            company: lines[1] || 'Programathor',
            rawText: text,
          };
        }).filter(x => x.title && x.href.includes('/jobs/') && !x.href.endsWith('/jobs'));
      });

      for (const item of jobLinks) {
        let location = 'Brasil';
        if (item.rawText.includes('Remoto')) location = 'Remoto';
        else if (item.rawText.includes('Presencial')) location = 'Presencial';
        else if (item.rawText.includes('Híbrido')) location = 'Híbrido';

        jobs.push({
          title: item.title,
          company: item.company,
          platform: PlatformSource.PROGRAMATHOR,
          url: item.href,
          description: `${item.title} - ${item.company} (${location})`,
          publishedAt: new Date(),
          location,
        });
      }
    } catch (err) {
      console.warn('[ProgramathorScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }

  private stripTags(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
  }
}
