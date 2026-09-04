import './globals.css';
import type { Metadata } from 'next';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

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
      <body className="min-h-screen flex flex-col antialiased bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <TooltipProvider>
          <Navbar />

          <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>

          <footer className="border-t border-zinc-200 dark:border-zinc-800/60 py-6 text-center text-xs text-zinc-500">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
              <p>© {new Date().getFullYear()} Buscavag Engine. Todos os direitos reservados.</p>
              <p>Desenvolvido para Moacir Neto • Full Stack Jr & IoT</p>
            </div>
          </footer>
        </TooltipProvider>
      </body>
    </html>
  );
}
