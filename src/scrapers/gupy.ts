import axios from 'axios';
import { JobScraper } from './base.js';
import { PlatformSource, RawJob } from '../types/job.js';
import { parseRelativeDate, isOlderThanDays } from '../utils/date.js';

export class GupyScraper implements JobScraper {
  name = 'Gupy';

  async scrape(): Promise<RawJob[]> {
    const jobs: RawJob[] = [];
    const keywords = ['full stack', 'fullstack', 'desenvolvedor junior', 'dev junior', 'frontend', 'backend'];
    const seenUrls = new Set<string>();

    for (const kw of keywords) {
      try {
        const url = `https://portal.gupy.io/api/job-search/jobs?jobName=${encodeURIComponent(kw)}&limit=25&offset=0`;
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
          },
          timeout: 15000,
        });

        if (response.data && Array.isArray(response.data.data)) {
          for (const item of response.data.data) {
            const jobUrl = item.jobUrl || (item.id ? `https://portal.gupy.io/job/${item.id}` : '');
            if (!jobUrl || seenUrls.has(jobUrl)) {
              continue;
            }

            const publishedAt = item.publishedDate ? new Date(item.publishedDate) : new Date();

            if (isOlderThanDays(publishedAt, 5)) {
              continue;
            }

            seenUrls.add(jobUrl);

            let location = 'Brasil';
            if (item.workplaceType === 'remote' || item.isRemote) {
              location = 'Remoto';
            } else if (item.city) {
              location = item.state ? `${item.city} - ${item.state}` : item.city;
            }

            jobs.push({
              title: item.name || 'Sem título',
              company: item.careerPageName || 'Gupy Partner',
              platform: PlatformSource.GUPY,
              url: jobUrl,
              description: item.description || `${item.name}`,
              publishedAt,
              location,
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
