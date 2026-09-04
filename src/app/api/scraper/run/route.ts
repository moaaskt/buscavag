import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { ScraperLogger } from '@/services/scraperLogger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    let runId = '';
    try {
      const body = await request.json();
      runId = body?.runId || '';
    } catch {
      // Body vazio é aceitável
    }

    const logger = new ScraperLogger('Pipeline', runId || undefined);
    const resolvedRunId = logger.getRunId();

    const cwd = process.cwd();
    const env = {
      ...process.env,
      SCRAPER_RUN_ID: resolvedRunId,
    };

    // Emite log inicial informando disparo do processo autônomo
    logger.info('Iniciando pipeline de scraper via processo isolado...', {
      step: 'START',
      data: { runId: resolvedRunId },
    });

    // Spawn the scraper process detached so it runs in background and emits logs to database/SSE
    const child = spawn('npm', ['run', 'start'], {
      cwd,
      detached: true,
      stdio: 'ignore',
      env,
    });

    child.unref();

    return NextResponse.json({
      success: true,
      runId: resolvedRunId,
      message: 'Sincronização iniciada com sucesso.',
    });
  } catch (error) {
    console.error('[API /api/scraper/run error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
