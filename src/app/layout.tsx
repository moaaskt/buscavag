import './globals.css';
import type { Metadata } from 'next';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { SyncToast } from "@/components/SyncToast";

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
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('buscavag_theme');
                if (storedTheme === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors">
        <TooltipProvider>
          <AuroraBackground>
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </main>

            <footer className="border-t border-zinc-200/40 dark:border-zinc-800/40 py-6 text-center text-xs text-zinc-500 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
                <p>© {new Date().getFullYear()} Buscavag Engine. Todos os direitos reservados.</p>
                <p>Desenvolvido para Moacir Neto • Full Stack Jr & IoT</p>
              </div>
            </footer>
          </AuroraBackground>
          <SyncToast />
        </TooltipProvider>
      </body>
    </html>
  );
}
