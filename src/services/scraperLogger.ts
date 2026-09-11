import { EventEmitter } from 'events';
import { LogLevel, ScraperLog } from '../types/log';
import { LogRepository } from '../db/logRepository';
import crypto from 'crypto';

export interface ScraperEvent {
  id: string;
  runId: string;
  scraperName: string;
  level: LogLevel;
  message: string;
  details?: string;
  timestamp: string;
  step?: 'START' | 'PROGRESS' | 'FINISH' | 'ERROR';
  data?: Record<string, any>;
}

class ScraperLogEventEmitter extends EventEmitter {}

// Instância global compartilhada (Singleton)
const globalEmitter = new ScraperLogEventEmitter();
// Aumenta o limite de listeners para múltiplos clientes SSE simultâneos
globalEmitter.setMaxListeners(100);

export class ScraperLogger {
  private runId: string;
  private scraperName: string;
  private repo: LogRepository;

  constructor(scraperName: string = 'System', runId?: string) {
    this.scraperName = scraperName;
    this.runId = runId || process.env.SCRAPER_RUN_ID || crypto.randomUUID();
    this.repo = new LogRepository();
  }

  public getRunId(): string {
    return this.runId;
  }

  public setRunId(runId: string): void {
    this.runId = runId;
  }

  public forScraper(scraperName: string): ScraperLogger {
    return new ScraperLogger(scraperName, this.runId);
  }

  public log(
    level: LogLevel,
    message: string,
    options?: { details?: string; step?: 'START' | 'PROGRESS' | 'FINISH' | 'ERROR'; data?: Record<string, any> }
  ): ScraperLog {
    const timestamp = new Date().toISOString();

    // 1. Salvar no banco de dados
    const savedLog = this.repo.insertLog({
      runId: this.runId,
      scraperName: this.scraperName,
      level,
      message,
      details: options?.details,
    });

    // 2. Montar evento estruturado
    const event: ScraperEvent = {
      id: savedLog.id,
      runId: this.runId,
      scraperName: this.scraperName,
      level,
      message,
      details: options?.details,
      timestamp,
      step: options?.step,
      data: options?.data,
    };

    // 3. Emitir evento para clientes SSE
    globalEmitter.emit('log', event);

    return savedLog;
  }

  public info(message: string, options?: { details?: string; step?: 'START' | 'PROGRESS' | 'FINISH'; data?: Record<string, any> }): ScraperLog {
    return this.log('INFO', message, options);
  }

  public warn(message: string, options?: { details?: string; step?: 'PROGRESS'; data?: Record<string, any> }): ScraperLog {
    return this.log('WARN', message, options);
  }

  public error(message: string, errorOrDetails?: unknown, options?: { step?: 'ERROR'; data?: Record<string, any> }): ScraperLog {
    let details: string | undefined;
    if (errorOrDetails instanceof Error) {
      details = `${errorOrDetails.message}\n${errorOrDetails.stack || ''}`;
    } else if (typeof errorOrDetails === 'string') {
      details = errorOrDetails;
    } else if (errorOrDetails) {
      details = JSON.stringify(errorOrDetails, null, 2);
    }

    return this.log('ERROR', message, { details, step: 'ERROR', data: options?.data });
  }

  /**
   * Registra um listener SSE global para receber eventos em tempo real
   */
  public static subscribe(listener: (event: ScraperEvent) => void): () => void {
    globalEmitter.on('log', listener);
    return () => {
      globalEmitter.off('log', listener);
    };
  }
}
