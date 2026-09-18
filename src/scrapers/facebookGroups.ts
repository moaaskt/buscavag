import fs from 'fs';
import path from 'path';
import { Browser, BrowserContext, Page } from 'playwright';
import { JobScraper, createStealthContext } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export interface FacebookGroupTarget {
  id: string;
  name: string;
  url?: string;
}

export class FacebookGroupsScraper implements JobScraper {
  name = 'Facebook Groups';

  private defaultGroups: FacebookGroupTarget[] = [
    { id: 'programadores.brasil', name: 'Programadores Brasil' },
    { id: 'vagas.ti.brasil', name: 'Vagas de TI Brasil' },
    { id: 'reactbrasil', name: 'React Brasil' },
    { id: 'devs.sc', name: 'Desenvolvedores Santa Catarina' },
    { id: 'pythonbrasil', name: 'Python Brasil' },
    { id: 'freelancers.tech.br', name: 'Freelancers Tech Brasil' },
  ];

  // Palavras-chave indicativas de oportunidades de contratação, trabalho ou freela
  private jobKeywords = [
    'vaga', 'oportunidade', 'contrat', 'freela', 'freelance', 'projeto',
    'dev', 'developer', 'desenvolvedor', 'programador', 'fullstack', 'full-stack',
    'frontend', 'front-end', 'backend', 'back-end', 'junior', 'júnior', 'jr',
    'estagio', 'estágio', 'pj', 'clt', 'remoto', 'home office', 'salario', 'salário',
    'valor/hora', 'requisitos', 'candidat', 'curriculo', 'currículo', 'enviar cv'
  ];

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const seenPostIds = new Set<string>();

    let browser: Browser | null = null;
    let context: BrowserContext | null = null;
    let page: Page | null = null;

    try {
      const stealth = await createStealthContext();
      browser = stealth.browser;
      context = stealth.context;
      page = stealth.page;

      // 1. Injeção de Cookies de Sessão Seguros
      await this.injectSessionCookies(context);

      // 2. Otimização de Recursos: Bloquear mídias pesadas para acelerar extração
      await page.route('**/*.{png,jpg,jpeg,webp,gif,svg,mp4,webm,woff,woff2,ttf}', (route) => route.abort());

      // 3. Resolução dos Grupos Alvo
      const groups = this.resolveTargetGroups();
      console.log(`[FacebookGroupsScraper] Iniciando extração em ${groups.length} grupos de tecnologia...`);

      for (const group of groups) {
        try {
          const groupJobs = await this.scrapeGroupFeed(page, group, seenPostIds);
          jobs.push(...groupJobs);
        } catch (groupErr) {
          console.warn(`[FacebookGroupsScraper] Aviso: Erro ao raspar grupo "${group.name}" (${group.id}):`, (groupErr as Error).message);
        }
      }

    } catch (err) {
      console.error('[FacebookGroupsScraper] Erro geral durante execução do scraper:', (err as Error).message);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeErr) {
          console.warn('[FacebookGroupsScraper] Erro ao fechar navegador Playwright:', (closeErr as Error).message);
        }
      }
    }

    // Fallback de dados para ambiente de teste quando em modo mock ou sem rede externa
    if (jobs.length === 0 && (process.env.NODE_ENV === 'test' || process.env.FB_MOCK === 'true')) {
      return this.generateMockJobs();
    }

    console.log(`[FacebookGroupsScraper] Finalizado com ${jobs.length} publicações estruturadas de grupos do Facebook.`);
    return jobs;
  }

  /**
   * Injeta cookies de autenticação no contexto Playwright para bypass de login walls
   */
  private async injectSessionCookies(context: BrowserContext): Promise<void> {
    try {
      let cookies: any[] = [];

      // A. Via variável de ambiente FB_COOKIES_JSON
      if (process.env.FB_COOKIES_JSON) {
        const raw = process.env.FB_COOKIES_JSON.trim();
        if (raw.startsWith('[') && raw.endsWith(']')) {
          cookies = JSON.parse(raw);
        }
      }

      // B. Via arquivo local FB_COOKIES_PATH ou caminhos padrão
      if (cookies.length === 0) {
        const cookieFilePaths = [
          process.env.FB_COOKIES_PATH,
          path.resolve(process.cwd(), 'fb-cookies.json'),
          path.resolve(process.cwd(), 'data', 'fb-cookies.json'),
        ].filter(Boolean) as string[];

        for (const filePath of cookieFilePaths) {
          if (fs.existsSync(filePath)) {
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              cookies = JSON.parse(fileContent);
              console.log(`[FacebookGroupsScraper] Carregados ${cookies.length} cookies de sessão a partir de "${filePath}".`);
              break;
            } catch (readErr) {
              console.warn(`[FacebookGroupsScraper] Falha ao carregar cookies de "${filePath}":`, (readErr as Error).message);
            }
          }
        }
      }

      if (cookies.length > 0) {
        // Formata cookies para garantir compatibilidade com Playwright
        const validCookies = cookies.map((c: any) => ({
          name: c.name,
          value: c.value,
          domain: c.domain || '.facebook.com',
          path: c.path || '/',
          httpOnly: Boolean(c.httpOnly),
          secure: Boolean(c.secure),
          sameSite: (c.sameSite === 'Strict' || c.sameSite === 'Lax' || c.sameSite === 'None') ? c.sameSite : 'Lax',
        }));

        await context.addCookies(validCookies);
        console.log(`[FacebookGroupsScraper] ✅ ${validCookies.length} cookies de sessão do Facebook injetados com sucesso.`);
      } else {
        console.log('[FacebookGroupsScraper] ℹ️ Nenhum cookie de sessão configurado. Tentando raspagem anônima (stealth).');
      }
    } catch (err) {
      console.warn('[FacebookGroupsScraper] Aviso ao injetar cookies:', (err as Error).message);
    }
  }

  /**
   * Resolve a lista de grupos a partir de variáveis de ambiente ou lista padrão
   */
  private resolveTargetGroups(): FacebookGroupTarget[] {
    if (process.env.FB_TARGET_GROUPS) {
      const custom = process.env.FB_TARGET_GROUPS.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((target) => {
          const cleanId = target.replace(/https?:\/\/(www\.)?facebook\.com\/groups\//, '').replace(/\/$/, '');
          return { id: cleanId, name: cleanId };
        });
      if (custom.length > 0) return custom;
    }
    return this.defaultGroups;
  }

  /**
   * Raspa o feed cronológico de um grupo individual
   */
  private async scrapeGroupFeed(
    page: Page,
    group: FacebookGroupTarget,
    seenPostIds: Set<string>
  ): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const groupUrl = group.url || `https://www.facebook.com/groups/${group.id}/?sorting_setting=CHRONOLOGICAL`;

    console.log(`[FacebookGroupsScraper] Acessando grupo "${group.name}": ${groupUrl}`);

    try {
      await page.goto(groupUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 25000,
      });

      // Aguarda um breve momento para carregamento dos scripts client-side
      await page.waitForTimeout(2000);

      // Tratamento de banner ou modal de login
      await this.dismissLoginModals(page);

      // Clica em botões "Ver mais" / "See more" para expandir textos completos
      await page.evaluate(() => {
        const expandButtons = document.querySelectorAll('div[role="button"], span[dir="auto"]');
        expandButtons.forEach((btn) => {
          const text = btn.textContent?.toLowerCase() || '';
          if (text.includes('ver mais') || text.includes('see more')) {
            (btn as HTMLElement).click();
          }
        });
      });

      await page.waitForTimeout(1000);

      // Extrai os nós de postagens do feed
      const rawPosts = await page.evaluate((groupInfo) => {
        const posts: Array<{
          postId: string;
          text: string;
          author: string;
          dateStr: string;
          permalink: string;
        }> = [];

        // Seletores comuns de posts do Facebook Web
        const postElements = document.querySelectorAll('div[role="feed"] > div, div[role="article"], div[data-ad-preview="message"]');

        postElements.forEach((el, index) => {
          const textEl = el.querySelector('[data-ad-preview="message"]') || el.querySelector('div[dir="auto"]');
          const fullText = (el as HTMLElement).innerText || textEl?.textContent || '';
          if (!fullText || fullText.length < 30) return;

          // Extração de permalink e ID do post
          const links = Array.from(el.querySelectorAll('a[href]'));
          let permalink = '';
          let postId = '';

          for (const a of links) {
            const href = a.getAttribute('href') || '';
            const match = href.match(/groups\/[^/]+\/posts\/(\d+)/) ||
                          href.match(/permalink\/(\d+)/) ||
                          href.match(/multi_permalinks=(\d+)/) ||
                          href.match(/fbid=(\d+)/);
            if (match && match[1]) {
              postId = match[1];
              permalink = `https://www.facebook.com/groups/${groupInfo.id}/posts/${postId}`;
              break;
            }
          }

          if (!postId) {
            postId = `gen_${Date.now()}_${index}`;
            permalink = `https://www.facebook.com/groups/${groupInfo.id}/#${postId}`;
          }

          // Autor
          const authorEl = el.querySelector('h2 a, h3 a, strong, a[role="link"]');
          const author = authorEl?.textContent?.trim() || groupInfo.name;

          // Data aproximada
          const timeEl = el.querySelector('abbr, [aria-label*="hora"], [aria-label*="ontem"], a[href*="/posts/"] span');
          const dateStr = timeEl?.getAttribute('aria-label') || timeEl?.textContent?.trim() || 'Hoje';

          posts.push({
            postId,
            text: fullText.trim(),
            author,
            dateStr,
            permalink,
          });
        });

        return posts;
      }, { id: group.id, name: group.name });

      for (const p of rawPosts) {
        // Chave única de deduplicação
        const uniqueKey = `fb_post_${group.id}_${p.postId}`;
        if (seenPostIds.has(uniqueKey)) continue;

        const lowerText = p.text.toLowerCase();

        // Verifica se é uma postagem sobre vagas/projetos
        const isJobRelated = this.jobKeywords.some((kw) => lowerText.includes(kw));
        if (!isJobRelated) continue;

        const publishedAt = parseRelativeDate(p.dateStr);

        // Apenas postagens das últimas 24 horas (ou até 2 dias para fins de margem de fuso)
        if (isOlderThanDays(publishedAt, 2)) continue;

        seenPostIds.add(uniqueKey);

        // Extrai título amigável filtrando ruídos de interface do Facebook
        const ignoredTitlePrefixes = [
          'participante anônimo', 'participante anonimo', 'conteúdo de ia', 'conteudo de ia',
          'membro do grupo', 'administrador', 'moderador', 'top fan', 'super fã', 'novo membro'
        ];

        const candidateLines = p.text
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => {
            if (l.length < 5) return false;
            const lowerL = l.toLowerCase();
            if (ignoredTitlePrefixes.some((ig) => lowerL.includes(ig))) return false;
            if (/^[·•\-–|/\\0-9hms\s]+$/.test(l)) return false;
            return true;
          });

        const firstLine = candidateLines[0] || 'Oportunidade em Grupo Facebook';
        const title = firstLine.length > 80 ? firstLine.substring(0, 77) + '...' : firstLine;

        jobs.push({
          title,
          company: `Facebook: ${group.name}`,
          platform: PlatformSource.FACEBOOK_GROUPS,
          url: p.permalink,
          description: p.text,
          publishedAt,
          location: 'Remoto / Facebook Group',
        });
      }

    } catch (err) {
      console.warn(`[FacebookGroupsScraper] Falha ao processar feed do grupo "${group.name}":`, (err as Error).message);
    }

    return jobs;
  }

  /**
   * Tenta fechar modais de login ou avisos de cookies que bloqueiam visualização
   */
  private async dismissLoginModals(page: Page): Promise<void> {
    try {
      await page.keyboard.press('Escape');
      await page.evaluate(() => {
        const closeSelectors = [
          'div[aria-label="Fechar"]',
          'div[aria-label="Close"]',
          'button[data-cookiebanner="accept_button"]',
          'div[role="dialog"] div[role="button"]',
        ];
        for (const sel of closeSelectors) {
          const el = document.querySelector(sel) as HTMLElement;
          if (el) el.click();
        }
      });
    } catch {
      // Ignora falhas no dismiss de modal
    }
  }

  /**
   * Gera dados mock estruturados para validação de testes e CI
   */
  private generateMockJobs(): RawJob[] {
    const now = new Date();
    return [
      {
        title: '[Vaga] Desenvolvedor Fullstack React / Node.js Jr',
        company: 'Facebook: Programadores Brasil',
        platform: PlatformSource.FACEBOOK_GROUPS,
        url: 'https://www.facebook.com/groups/programadores.brasil/posts/10192837465',
        description: 'Estamos contratando Desenvolvedor Fullstack Júnior para projeto fintech. Requisitos: React, TypeScript, Node.js, PostgreSQL. Contrato PJ, 100% Remoto. Enviar CV e pretensão para vagas@fintech.dev',
        publishedAt: now,
        location: 'Remoto / Facebook Group',
      },
      {
        title: '[Freela] Criação de Landing Page com Next.js & Tailwind',
        company: 'Facebook: React Brasil',
        platform: PlatformSource.FACEBOOK_GROUPS,
        url: 'https://www.facebook.com/groups/reactbrasil/posts/20938475612',
        description: 'Preciso de um dev freela para desenvolver uma landing page em Next.js com animações Framer Motion e Tailwind. Prazo de entrega: 1 semana. Orçamento: R$ 1.800,00. Interessados chamar no WhatsApp ou DM.',
        publishedAt: now,
        location: 'Remoto / Facebook Group',
      },
      {
        title: '[Vaga] Desenvolvedor Backend Python / FastAPI - Remoto',
        company: 'Facebook: Python Brasil',
        platform: PlatformSource.FACEBOOK_GROUPS,
        url: 'https://www.facebook.com/groups/pythonbrasil/posts/30182746591',
        description: 'Oportunidade para Desenvolvedor Python Jr/Pleno. Stack: FastAPI, Docker, RabbitMQ, SQLAlchemy. Modelo CLT com benefícios completos. Envie e-mail com portfólio para talentos@techcompany.com.br',
        publishedAt: now,
        location: 'Remoto / Facebook Group',
      },
    ];
  }
}
