import React from 'react';
import { Navbar } from '@/components/Navbar';
import { AuroraBackground } from '@/components/ui/aurora-background';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground>
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {children}
      </main>

      <footer className="border-t border-zinc-200/40 dark:border-zinc-800/40 py-6 text-center text-xs text-zinc-500 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
          <p>© {new Date().getFullYear()} Buscavag • Inteligência em Vagas Tech & IA</p>
          <p className="text-zinc-400 dark:text-zinc-600">Match Semântico & Monitoramento em Tempo Real</p>
        </div>
      </footer>
    </AuroraBackground>
  );
}
