import * as cheerio from 'cheerio';
import { fetchHtml, createStealthContext, JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class SolidesScraper implements JobScraper {
  name = 'Sólides';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const searchTerms = ['desenvolvedor', 'programador'];
    const { browser, context, page } = await createStealthContext();
    const seenUrls = new Set<string>();

    try {
      for (const term of searchTerms) {
        const searchUrl = `https://vagas.solides.com.br/vagas/${encodeURIComponent(term)}`;
        try {
          await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
          await page.waitForTimeout(5000);

          const extracted = await page.evaluate(() => {
            const items: { title: string; company: string; location: string; url: string }[] = [];
            const links = Array.from(document.querySelectorAll('a[href*=".vagas.solides.com.br"]'));

            links.forEach((a) => {
              const href = (a as HTMLAnchorElement).href;
              const parent = a.closest('.flex.flex-col') || a.parentElement;
              const text = parent ? (parent as HTMLElement).innerText : (a as HTMLElement).innerText;
              const lines = text.split('\n').map(s => s.trim()).filter(Boolean);

              if (lines.length >= 2) {
                const title = lines[0];
                const company = lines[1];
                let location = 'Brasil';
                const locLine = lines.find(l => l.includes(' - ') || l.includes('Remoto') || l.includes('Home Office'));
                if (locLine) location = locLine;

                if (title && title.length > 3 && !['Vagas', 'Blog', 'Cursos', 'Para Empresas', 'Trabalhe com a Sólides', 'Entrar', 'Cadastrar-se'].includes(title)) {
                  items.push({ title, company, location, url: href });
                }
              }
            });

            return items;
          });

          for (const item of extracted) {
            if (seenUrls.has(item.url)) continue;
            seenUrls.add(item.url);

            jobs.push({
              title: item.title,
              company: item.company || 'Empresa Sólides',
              platform: PlatformSource.SOLIDES,
              url: item.url,
              description: `${item.title} - ${item.company} (${item.location})`,
              publishedAt: new Date(),
              location: item.location || 'Brasil',
            });
          }
        } catch (termErr) {
          console.warn(`[SolidesScraper] Erro ao buscar termo "${term}":`, (termErr as Error).message);
        }
      }
    } catch (err) {
      console.warn('[SolidesScraper] Playwright erro:', (err as Error).message);
    } finally {
      await context.close();
      await browser.close();
    }

    return jobs;
  }
}
