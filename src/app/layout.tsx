import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LayoutDashboard, Briefcase, Columns3, Sparkles } from 'lucide-react';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'Buscavag | Intelligence Job Platform',
  description: 'Sistema Autônomo de Monitoramento, Avaliação por IA e Gestão de Candidaturas de Vagas',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={cn("dark", "font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col antialiased">
        <TooltipProvider>
          <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-sky-400 via-indigo-300 to-white bg-clip-text text-transparent">
                      BUSCAVAG
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      AI v2.0
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Autonomous Job Intelligence & Board</p>
                </div>
              </Link>

              <nav className="flex items-center gap-1 md:gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-sky-400" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/jobs"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                  <span>Explorar Vagas</span>
                </Link>
                <Link
                  href="/board"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Columns3 className="w-4 h-4 text-emerald-400" />
                  <span>Kanban Board</span>
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>

          <footer className="border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Buscavag. Todos os direitos reservados. Desenvolvido para Moacir Neto.</p>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
