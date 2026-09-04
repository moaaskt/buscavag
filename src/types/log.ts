export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface ScraperLog {
  id: string;
  runId: string;
  scraperName: string;
  level: LogLevel;
  message: string;
  details?: string;
  createdAt: Date;
}

export interface LogFilterOptions {
  level?: LogLevel;
  scraperName?: string;
  runId?: string;
  period?: string; // '24h' | '48h' | '7d' | '30d'
  limit?: number;
  offset?: number;
}

export interface ScraperRunSummary {
  runId: string;
  startedAt: Date;
  completedAt?: Date;
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  scrapersRun: string[];
}
