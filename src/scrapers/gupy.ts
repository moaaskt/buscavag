import axios from 'axios';
import { JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class GupyScraper implements JobScraper {
  name = 'Gupy';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const keywords = ['full stack', 'fullstack', 'desenvolvedor junior', 'dev junior'];

    for (const kw of keywords) {
      try {
        const url = `https://portal.gupy.io/api/v1/jobs?name=${encodeURIComponent(kw)}&limit=20&offset=0`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        });

        if (response.data && Array.isArray(response.data.data)) {
          for (const item of response.data.data) {
            const publishedAt = item.publishedDate ? new Date(item.publishedDate) : new Date();

            if (isOlderThanDays(publishedAt, 5)) {
              continue;
            }

            jobs.push({
              title: item.name || 'Sem título',
              company: item.careerPageName || 'Gupy Partner',
              platform: PlatformSource.GUPY,
              url: item.jobUrl || `https://portal.gupy.io/job/${item.id}`,
              description: item.description || `${item.name} - ${item.role}`,
              publishedAt,
              location: item.isRemote ? 'Remoto' : item.city || 'Brasil',
            });
          }
        }
      } catch (err) {
        console.warn(`[GupyScraper] Erro ao buscar palavra-chave "${kw}":`, (err as Error).message);
      }
    }

    return jobs;
  }
}
