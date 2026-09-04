'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  RotateCw,
  Sun,
  Moon,
  KanbanSquare,
  LayoutDashboard,
  User,
  Trash2,
} from 'lucide-react';
import { LoaderThree } from '@/components/ui/loader';
import { FlashIcon } from '@/components/ui/flash-icon';
import { cn } from '@/lib/utils';
import { CanvasText } from '@/components/ui/canvas-text';
import { confirmPurge } from '@/lib/alerts';
import { ScraperTerminalModal } from '@/components/ScraperTerminalModal';
import {
  ResizableNavbarContainer,
  NavBody,
  NavItems,
} from '@/components/ui/resizable-navbar';
import { FloatingDockMobile, FloatingDockItem } from '@/components/ui/floating-dock';

interface NavbarProps {
  scrapersActiveCount?: number;
  userName?: string;
  userRole?: string;
}

export function Navbar({
  scrapersActiveCount = 26,
  userName = 'Moacir Neto',
  userRole = 'Full Stack Jr & IoT',
}: NavbarProps) {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      link: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Explorador de Vagas',
      link: '/jobs',
      icon: Compass,
      active: pathname.startsWith('/jobs'),
    },
    {
      name: 'Kanban de Candidaturas',
      link: '/board',
      icon: KanbanSquare,
      active: pathname.startsWith('/board'),
    },
    {
      name: 'Logs & Auditoria',
      link: '/logs',
      icon: RotateCw,
      active: pathname.startsWith('/logs'),
    },
  ];

  const handleSync = async () => {
    setIsTerminalOpen(true);
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/scraper/trigger', { method: 'POST' });
      const json = await res.json();

      // Notify the toast
      window.dispatchEvent(
        new CustomEvent('buscavag:sync-done', {
          detail: { success: json.success, message: json.message || json.error },
        })
      );

      // If on /jobs page, trigger a silent refetch after a short delay
      if (json.success) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('buscavag:refetch-jobs'));
        }, 2500);
      }
    } catch (e) {
      console.error('[Navbar sync error]:', e);
      window.dispatchEvent(
        new CustomEvent('buscavag:sync-done', {
          detail: { success: false, message: 'Erro de conexão ao iniciar scraper.' },
        })
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePurge = async () => {
    if (isPurging) return;
    const confirmed = await confirmPurge();
    if (!confirmed) return;

    setIsPurging(true);
    try {
      const res = await fetch('/api/jobs/purge-non-tech', { method: 'POST' });
      const json = await res.json();

      window.dispatchEvent(
        new CustomEvent('buscavag:purge-done', {
          detail: {
            success: json.success,
            title: json.success ? 'Purga concluída!' : 'Falha na purga',
            message: json.message || (json.success ? `${json.deletedCount} vagas não-tech removidas.` : json.error),
          },
        })
      );

      if (json.success) {
        window.dispatchEvent(new CustomEvent('buscavag:refetch-jobs'));
      }
    } catch (e) {
      console.error('[Navbar purge error]:', e);
      window.dispatchEvent(
        new CustomEvent('buscavag:purge-done', {
          detail: {
            success: false,
            title: 'Falha na purga',
            message: 'Erro de comunicação ao purgar vagas não-tech.',
          },
        })
      );
    } finally {
      setIsPurging(false);
    }
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
  };

  const mobileDockItems: FloatingDockItem[] = [
    {
      title: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="h-full w-full" />,
      active: pathname === '/',
    },
    {
      title: 'Explorador',
      href: '/jobs',
      icon: <Compass className="h-full w-full" />,
      active: pathname.startsWith('/jobs'),
    },
    {
      title: 'Kanban',
      href: '/board',
      icon: <KanbanSquare className="h-full w-full" />,
      active: pathname.startsWith('/board'),
    },
    {
      title: 'Logs',
      href: '/logs',
      icon: <RotateCw className="h-full w-full" />,
      active: pathname.startsWith('/logs'),
    },
    {
      title: isPurging ? 'Purgando...' : 'Purgar Não-Tech',
      href: '#',
      onClick: handlePurge,
      icon: <Trash2 className={cn("h-full w-full", isPurging ? "text-rose-400 animate-spin" : "text-zinc-400 hover:text-rose-400")} />,
    },
    {
      title: isSyncing ? 'Executando Scraper...' : 'Sincronizar',
      href: '#',
      onClick: handleSync,
      icon: <FlashIcon loading={isSyncing} className={cn("h-full w-full", isSyncing ? "text-emerald-500 animate-pulse" : "")} />,
    },
    {
      title: isDarkMode ? 'Modo Claro' : 'Modo Escuro',
      href: '#',
      onClick: toggleTheme,
      icon: isDarkMode ? (
        <Sun className="h-full w-full text-amber-400" />
      ) : (
        <Moon className="h-full w-full text-zinc-400" />
      ),
    },
  ];

  return (
    <>
      {/* Mobile Top Minimal Bar */}
      <header className="sticky top-0 z-40 flex w-full items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-950/80 px-4 py-2.5 backdrop-blur-md transition-colors md:hidden">
        <Link href="/" className="flex items-center">
          <CanvasText
            text="Buscavag"
            className="text-lg font-bold tracking-tight font-sans"
            backgroundClassName="bg-emerald-600 dark:bg-emerald-500"
            colors={[
              "rgba(16, 185, 129, 1)",
              "rgba(255, 255, 255, 0.9)",
              "rgba(16, 185, 129, 0.8)",
              "rgba(255, 255, 255, 0.7)",
              "rgba(16, 185, 129, 0.6)",
              "rgba(255, 255, 255, 0.5)",
              "rgba(16, 185, 129, 0.4)",
              "rgba(255, 255, 255, 0.3)",
              "rgba(16, 185, 129, 0.2)",
              "rgba(255, 255, 255, 0.1)",
            ]}
            lineGap={4}
            animationDuration={15}
          />
        </Link>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 px-2 py-0.5 text-[10px] font-mono text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{scrapersActiveCount} scrapers</span>
          </div>

          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs">
            <User className="h-3 w-3 text-zinc-500" />
          </div>
        </div>
      </header>

      {/* Desktop Resizable Navigation */}
      <ResizableNavbarContainer className="hidden md:block">
        <NavBody>
          {/* Brand / Logo */}
          <Link href="/" className="flex items-center shrink-0 pr-2">
            <CanvasText
              text="Buscavag"
              className="text-lg md:text-xl font-extrabold tracking-tight font-sans"
              backgroundClassName="bg-emerald-600 dark:bg-emerald-500"
              colors={[
                "rgba(16, 185, 129, 1)",
                "rgba(255, 255, 255, 0.9)",
                "rgba(16, 185, 129, 0.8)",
                "rgba(255, 255, 255, 0.7)",
                "rgba(16, 185, 129, 0.6)",
                "rgba(255, 255, 255, 0.5)",
                "rgba(16, 185, 129, 0.4)",
                "rgba(255, 255, 255, 0.3)",
                "rgba(16, 185, 129, 0.2)",
                "rgba(255, 255, 255, 0.1)",
              ]}
              lineGap={4}
              animationDuration={15}
            />
          </Link>

          {/* Dynamic Center Navigation Items */}
          <NavItems items={navItems} />

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Indicador do Scraper Engine */}
            <div className="hidden xl:flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>
                Scrapers:{' '}
                <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
                  {scrapersActiveCount} fontes
                </strong>
              </span>
            </div>

            {/* Botão Purgar Não-Tech */}
            <button
              onClick={handlePurge}
              disabled={isPurging}
              type="button"
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 shadow-sm disabled:cursor-not-allowed ${
                isPurging
                  ? 'border-rose-700/60 bg-rose-950/40 text-rose-400 opacity-90'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-400'
              }`}
              title="Purgar vagas não-tech do banco de dados"
            >
              <Trash2
                className={cn('w-3.5 h-3.5', isPurging ? 'text-rose-400 animate-spin' : 'text-zinc-400')}
              />
              <span className="hidden lg:inline">
                {isPurging ? 'Purgando...' : 'Purgar Não-Tech'}
              </span>
            </button>

            {/* Botão Sincronizar com LoaderThree */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              type="button"
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95 shadow-sm disabled:cursor-not-allowed ${
                isSyncing
                  ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-400 opacity-90'
                  : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
              title={isSyncing ? 'Scraper em execução...' : 'Sincronizar dados agora'}
            >
              <FlashIcon
                loading={isSyncing}
                className={cn('w-4 h-4', isSyncing ? 'text-emerald-400 animate-pulse' : 'text-zinc-400')}
              />
              <span className="hidden sm:inline">
                {isSyncing ? 'Executando Scraper...' : 'Sincronizar'}
              </span>
            </button>

            {/* Alternador de Tema */}
            <button
              onClick={toggleTheme}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors shadow-sm"
              title={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Perfil */}
            <div className="flex items-center gap-2 pl-1 border-l border-zinc-200 dark:border-zinc-800">
              <div className="hidden text-right lg:block">
                <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-none">
                  {userName}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  {userRole}
                </div>
              </div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs shadow-sm">
                <User className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />
              </div>
            </div>
          </div>
        </NavBody>
      </ResizableNavbarContainer>

      {/* Floating Dock para Mobile (Responsivo) */}
      <FloatingDockMobile items={mobileDockItems} />

      {/* Terminal Hacker / Modal de Logs em Tempo Real */}
      <ScraperTerminalModal
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
      />
    </>
  );
}
