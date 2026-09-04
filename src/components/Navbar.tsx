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
} from 'lucide-react';
import { LoaderThree } from '@/components/ui/loader';
import { CanvasText } from '@/components/ui/canvas-text';
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
  ];

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/stats');
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 1000);
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
      title: isSyncing ? 'Sincronizando...' : 'Sincronizar',
      href: '#',
      onClick: handleSync,
      icon: isSyncing ? (
        <LoaderThree size={18} className="text-emerald-500" />
      ) : (
        <RotateCw className="h-full w-full" />
      ),
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
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <Compass className="h-4 w-4" />
          </div>
          <CanvasText
            text="Buscavag"
            className="text-sm font-semibold tracking-tight"
            backgroundClassName="bg-zinc-900 dark:bg-zinc-100"
            colors={[
              "#10b981",
              "#06b6d4",
              "#3b82f6",
              "#8b5cf6",
              "#34d399",
              "#38bdf8",
            ]}
            lineGap={4}
            lineWidth={1.2}
            animationDuration={8}
          />
          <span className="rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-1 py-0.5 text-[8px] font-mono font-medium text-zinc-500 dark:text-zinc-400 uppercase">
            v2.4
          </span>
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
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
              <Compass className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <CanvasText
                text="Buscavag"
                className="text-sm font-semibold tracking-tight"
                backgroundClassName="bg-zinc-900 dark:bg-zinc-100"
                colors={[
                  "#10b981",
                  "#06b6d4",
                  "#3b82f6",
                  "#8b5cf6",
                  "#34d399",
                  "#38bdf8",
                ]}
                lineGap={4}
                lineWidth={1.2}
                animationDuration={8}
              />
              <span className="rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                v2.4 Pro
              </span>
            </div>
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

            {/* Botão Sincronizar com LoaderThree */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
              title="Sincronizar dados agora"
            >
              {isSyncing ? (
                <LoaderThree size={14} className="text-emerald-500" />
              ) : (
                <RotateCw className="h-3.5 w-3.5 text-zinc-400" />
              )}
              <span className="hidden sm:inline">Sincronizar</span>
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
    </>
  );
}
