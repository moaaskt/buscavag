import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/index';
import { ScraperLogger } from '@/services/scraperLogger';

export const dynamic = 'force-dynamic';

// Variável para prevenir execuções concorrentes acidentais se já houver um ciclo rodando
let isPipelineRunning = false;

export async function POST(request: NextRequest) {
  try {
    let runId = '';
    try {
      const body = await request.json();
      runId = body?.runId || '';
    } catch {
      // Body vazio é aceitável
    }

    if (isPipelineRunning) {
      return NextResponse.json({
        success: true,
        alreadyRunning: true,
        message: 'O scraper já está em execução.',
      });
    }

    const logger = new ScraperLogger('Pipeline', runId || undefined);
    
    // Dispara a execução do pipeline de forma assíncrona (não-bloqueante para a resposta HTTP)
    isPipelineRunning = true;
    (async () => {
      try {
        await runPipeline(logger);
      } catch (err) {
        logger.error(`Falha crítica durante execução do pipeline: ${(err as Error).message}`, err);
      } finally {
        isPipelineRunning = false;
      }
    })();

    return NextResponse.json({
      success: true,
      runId: logger.getRunId(),
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
