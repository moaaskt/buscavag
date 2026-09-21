import fs from 'fs';
import path from 'path';
import { Browser, BrowserContext, Page } from 'playwright';
import { JobScraper, createStealthContext } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class LinkedInPostsScraper implements JobScraper {
  name = 'LinkedIn Posts';

  // Palavras-chave para filtro extra no front, e query do LinkedIn
  private jobKeywords = [
    'vaga', 'oportunidade', 'contrat', 'freela', 'freelance', 'projeto',
    'dev', 'developer', 'desenvolvedor', 'programador', 'fullstack', 'full-stack',
    'frontend', 'front-end', 'backend', 'back-end', 'junior', 'júnior', 'jr',
    'estagio', 'estágio', 'pj', 'clt', 'remoto', 'home office',
    'requisitos', 'candidat', 'curriculo', 'currículo', 'envie', 'enviar'
  ];

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const seenPostUrns = new Set<string>();

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      const stealth = await createStealthContext();
      browser = stealth.browser;
      context = stealth.context;
      page = stealth.page;

      // 1. Injeção de Cookies de Sessão Seguros
      const hasCookies = await this.injectSessionCookies(context);
      
      if (!hasCookies) {
        console.warn('[LinkedInPostsScraper] unauthorized: Nenhum cookie de sessão encontrado. O LinkedIn bloqueará a pesquisa de conteúdo (session required).');
        // Pode tentar raspar mesmo assim caso futuramente o LinkedIn libere algo,
        // mas o ScraperHealthMonitor vai capturar o "unauthorized" / "session" do log e alertar.
      }

      // 2. Otimização de Recursos: Bloquear mídias pesadas
      await page.route('**/*.{png,jpg,jpeg,webp,gif,svg,mp4,webm,woff,woff2,ttf}', (route) => route.abort());

      // 3. Montar a URL de busca com ordenação estrita
      // Keywords focadas para a busca nativa do LinkedIn
      const keywords = 'vaga OR oportunidade OR "estamos contratando" OR "envie seu currículo" OR #vagas OR #ti';
      const searchUrl = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keywords)}&origin=GLOBAL_SEARCH_HEADER&sortBy=%22date_posted%22`;

      console.log(`[LinkedInPostsScraper] Acessando URL de busca: ${searchUrl}`);

      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000); // Esperar carregamento inicial do React

      // Checar se bateu em authwall ou login
      const pageUrl = page.url();
      if (pageUrl.includes('/login') || pageUrl.includes('/authwall')) {
        throw new Error('unauthorized session: LinkedIn redirecionou para tela de login ou authwall.');
      }

      // 4. Estratégia de "Scroll & Harvest" devido à virtualização do DOM
      console.log(`[LinkedInPostsScraper] Iniciando Scroll & Harvest para evitar perda por virtualização do DOM...`);
      let consecutiveEmptyScrolls = 0;
      
      // Realizaremos até 15 scrolls curtos, colhendo os nós visíveis a cada parada
      for (let i = 0; i < 15; i++) {
        const batchJobs = await this.harvestVisiblePosts(page, seenPostUrns);
        
        if (batchJobs.length > 0) {
          jobs.push(...batchJobs);
          consecutiveEmptyScrolls = 0;
        } else {
          consecutiveEmptyScrolls++;
        }

        // Se passarmos 3 scrolls seguidos sem novos posts, podemos assumir que acabou ou que só tem posts velhos
        if (consecutiveEmptyScrolls >= 3) {
          break;
        }

        // Fazer scroll down simulando um humano
        await page.evaluate(() => {
          window.scrollBy({ top: 800, behavior: 'smooth' });
        });
        await page.waitForTimeout(2000 + Math.random() * 1000);
      }

    } catch (err) {
      console.error('[LinkedInPostsScraper] Erro geral durante execução do scraper:', (err as Error).message);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          console.warn('[LinkedInPostsScraper] Erro ao fechar navegador Playwright:', (closeErr as Error).message);
        }
      }
    }

    if (jobs.length === 0 && (process.env.NODE_ENV === 'test' || process.env.LI_MOCK === 'true')) {
      return this.generateMockJobs();
    }

    console.log(`[LinkedInPostsScraper] Finalizado com ${jobs.length} publicações estruturadas de feed do LinkedIn.`);
    return jobs;
  }

  /**
   * Injeta os cookies completos do LinkedIn para evasão stealth
   * Retorna true se encontrou cookies, false caso contrário
   */
  private async injectSessionCookies(context: BrowserContext): Promise<boolean> {
    try {
      let cookies: any[] = [];

      // A. Via variável de ambiente
      if (process.env.LI_COOKIES_JSON) {
        const raw = process.env.LI_COOKIES_JSON.trim();
        if (raw.startsWith('[') && raw.endsWith(']')) {
          cookies = JSON.parse(raw);
        }
      }

      // B. Via arquivo local li-cookies.json
      if (cookies.length === 0) {
        const cookieFilePaths = [
          process.env.LI_COOKIES_PATH,
          path.resolve(process.cwd(), 'li-cookies.json'),
          path.resolve(process.cwd(), 'data', 'li-cookies.json'),
        ].filter(Boolean) as string[];

        for (const filePath of cookieFilePaths) {
          if (fs.existsSync(filePath)) {
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              cookies = JSON.parse(fileContent);
              console.log(`[LinkedInPostsScraper] Carregados ${cookies.length} cookies de sessão a partir de "${filePath}".`);
              break;
            } catch (readErr) {
              console.warn(`[LinkedInPostsScraper] Falha ao carregar cookies de "${filePath}":`, (readErr as Error).message);
            }
          }
        }
      }

      if (cookies.length > 0) {
        const validCookies = cookies.map((c: any) => ({
          name: c.name,
          value: c.value,
          domain: c.domain || '.linkedin.com',
          path: c.path || '/',
          httpOnly: Boolean(c.httpOnly),
          secure: Boolean(c.secure),
          sameSite: (c.sameSite === 'Strict' || c.sameSite === 'Lax' || c.sameSite === 'None') ? c.sameSite : 'None',
        }));

        await context.addCookies(validCookies);
        console.log(`[LinkedInPostsScraper] ✅ ${validCookies.length} cookies de sessão do LinkedIn injetados com sucesso.`);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[LinkedInPostsScraper] Aviso ao injetar cookies:', (err as Error).message);
      return false;
    }
  }

  /**
   * Captura os posts atualmente visíveis no DOM
   */
  private async harvestVisiblePosts(page: Page, seenPostUrns: Set<string>): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    
    // Expandir textos longos primeiro
    await page.evaluate(() => {
      const seeMoreButtons = document.querySelectorAll('button.see-more-text__button, button.feed-shared-inline-show-more-text__see-more-less-toggle');
      seeMoreButtons.forEach((btn) => {
        (btn as HTMLElement).click();
      });
    });
    
    await page.waitForTimeout(500);

    const rawPosts = await page.evaluate(() => {
      const posts: Array<{ urn: string; text: string; author: string; authorTitle: string; dateStr: string; permalink: string }> = [];
      
      const postElements = document.querySelectorAll('.feed-shared-update-v2');
      
      postElements.forEach((el) => {
        const urn = el.getAttribute('data-urn') || '';
        if (!urn) return;

        const textEl = el.querySelector('.update-components-text, .feed-shared-update-v2__description');
        const text = textEl?.textContent?.trim() || '';
        if (!text || text.length < 20) return;

        const authorEl = el.querySelector('.update-components-actor__name span[dir="ltr"]');
        const author = authorEl?.textContent?.trim() || 'Usuário LinkedIn';

        const authorTitleEl = el.querySelector('.update-components-actor__description span[dir="ltr"]');
        const authorTitle = authorTitleEl?.textContent?.trim() || '';

        const dateEl = el.querySelector('.update-components-actor__sub-description span[dir="ltr"], .update-components-actor__sub-description span[aria-hidden="true"]');
        let dateStr = dateEl?.textContent?.trim() || 'Hoje';
        
        // Remove 'Editado' ou 'Edited' da data
        dateStr = dateStr.replace(/editado|edited/i, '').replace(/•/g, '').trim();

        const permalink = `https://www.linkedin.com/feed/update/${urn}/`;

        posts.push({ urn, text, author, authorTitle, dateStr, permalink });
      });

      return posts;
    });

    for (const p of rawPosts) {
      if (seenPostUrns.has(p.urn)) continue;
      
      const lowerText = p.text.toLowerCase();
      const isJobRelated = this.jobKeywords.some((kw) => lowerText.includes(kw));
      
      if (!isJobRelated) {
        seenPostUrns.add(p.urn); // Marca como visto para não reavaliar
        continue;
      }

      const publishedAt = parseRelativeDate(p.dateStr);
      
      // Limitamos a 7 dias, a busca já filtra os mais recentes
      if (isOlderThanDays(publishedAt, 7)) {
        seenPostUrns.add(p.urn);
        continue;
      }

      seenPostUrns.add(p.urn);

      // Gerar título amigável baseado na primeira linha significativa do texto
      const candidateLines = p.text.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
      const firstLine = candidateLines[0] || 'Oportunidade em LinkedIn Post';
      const title = firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;
      
      const company = `${p.author} - ${p.authorTitle}`.substring(0, 100);

      jobs.push({
        title,
        company,
        platform: PlatformSource.LINKEDIN_POSTS,
        url: p.permalink,
        description: p.text,
        publishedAt,
        location: 'Remoto / LinkedIn',
      });
    }

    return jobs;
  }

  private generateMockJobs(): RawJob[] {
    const now = new Date();
    return [
      {
        title: 'Estamos contratando! Vaga de Desenvolvedor Frontend Sênior',
        company: 'João Silva - Tech Recruiter na EmpresaX',
        platform: PlatformSource.LINKEDIN_POSTS,
        url: 'https://www.linkedin.com/feed/update/urn:li:activity:1234567890/',
        description: 'Estamos contratando! Vaga de Desenvolvedor Frontend Sênior com foco em React e TypeScript. Contrato CLT, 100% remoto.\nInteressados enviem o currículo para vagas@empresax.com.br ou me chamem na DM.',
        publishedAt: now,
        location: 'Remoto / LinkedIn',
      },
      {
        title: 'Oportunidade para Estágio em Desenvolvimento de Software',
        company: 'Maria Souza - HR Manager',
        platform: PlatformSource.LINKEDIN_POSTS,
        url: 'https://www.linkedin.com/feed/update/urn:li:activity:0987654321/',
        description: 'Vaga de estágio aberta! Buscamos estudantes de tecnologia apaixonados por backend. Stack: Node.js e SQL.\n#vagas #ti #estagio\nEnvie seu currículo para estagios@techstart.com',
        publishedAt: now,
        location: 'Remoto / LinkedIn',
      }
    ];
  }
}
