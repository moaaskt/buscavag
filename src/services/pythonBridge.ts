import axios, { AxiosInstance } from 'axios';
import { RawJob, PlatformSource } from '../types/job.js';

export interface PythonScrapeOptions {
  query?: string;
  location?: string;
  limit?: number;
  options?: Record<string, any>;
}

export interface PythonScrapeResponse {
  success: boolean;
  source: string;
  count: number;
  jobs: Array<{
    id?: string;
    title: string;
    company: string;
    location: string;
    url: string;
    source: string;
    description?: string;
    publishedAt?: string;
    salary?: string;
    workModel?: string;
    extra?: Record<string, any>;
  }>;
  error?: string;
  executionTimeMs?: number;
}

export class PythonBridgeClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SCRAPLING_ENGINE_URL || 'http://localhost:8000';
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 45000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Verifica se o microserviço Python Scrapling Engine está online e saudável.
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 3000 });
      return response.status === 200 && response.data?.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Dispara a raspagem de uma fonte no microserviço Python.
   */
  async scrape(source: string, options?: PythonScrapeOptions): Promise<RawJob[]> {
    try {
      const response = await this.client.post<PythonScrapeResponse>('/scrape', {
        source,
        query: options?.query || 'desenvolvedor',
        location: options?.location,
        limit: options?.limit || 30,
        options: options?.options || {},
      });

      if (!response.data.success || !response.data.jobs) {
        throw new Error(response.data.error || `Falha desconhecida no Scrapling Engine para fonte ${source}`);
      }

      return response.data.jobs.map((item) => {
        return {
          title: item.title,
          company: item.company,
          location: item.location || 'Brasil / Remoto',
          url: item.url,
          platform: (item.source as PlatformSource) || (source as PlatformSource),
          description: item.description || '',
          publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
        };
      });
    } catch (err) {
      const msg = (err as Error).message || String(err);
      throw new Error(`[PythonBridgeClient] Erro ao consultar ${source}: ${msg}`);
    }
  }
}

