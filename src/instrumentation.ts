/**
 * Hook nativo de inicialização de servidor do Next.js (Instrumentation Hook).
 * Executado uma única vez no startup do runtime Node.js antes de aceitar conexões HTTP.
 * Garante que a aplicação em produção aborte fatalmente de imediato caso AUTH_SECRET seja inseguro.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateAuthSecretSecurity } = await import('./lib/auth');
    validateAuthSecretSecurity();
  }
}

