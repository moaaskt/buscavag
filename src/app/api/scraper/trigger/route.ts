import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the project root directory (assuming this API route is built inside .next/server/...)
    // A safer way is to just use process.cwd() since Next.js runs from the project root.
    const cwd = process.cwd();

    // Spawn the scraper process detached so it runs in the background
    // We run `npm run start` which is mapped to `tsx src/index.ts`
    const child = spawn('npm', ['run', 'start'], {
      cwd,
      detached: true,
      stdio: 'ignore', // Ignore stdio to allow it to run completely independently
    });

    // Unref the child process so the main Node.js process doesn't wait for it
    child.unref();

    return NextResponse.json({
      success: true,
      message: 'Scraper iniciado em background com sucesso.',
    });
  } catch (error) {
    console.error('[API /api/scraper/trigger error]:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
