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
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Explorador de Vagas', href: '/jobs', icon: Compass },
    { label: 'Kanban de Candidaturas', href: '/board', icon: KanbanSquare },
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md transition-colors duration-200">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand & Links de Navegação */}
        <div className="flex items-center gap-8">
          {/* Logo Buscavag */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
              <Compass className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Buscavag
              </span>
              <span className="rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 uppercase">
                v2.4 Pro
              </span>
            </div>
          </Link>

          {/* Abas Principais */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm border border-zinc-200 dark:border-zinc-700/60'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Status Operacional & Controles de Usuário */}
        <div className="flex items-center gap-3">
          {/* Indicador do Scraper Engine */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-2.5 py-1 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>
              Scrapers Ativos:{' '}
              <strong className="text-zinc-800 dark:text-zinc-200 font-semibold">
                {scrapersActiveCount} fontes
              </strong>
            </span>
          </div>

          {/* Botão Sincronizar */}
          <button
            onClick={handleSync}
            disabled={isSyncing}
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 active:scale-95 transition-all disabled:opacity-50 shadow-sm"
            title="Sincronizar dados agora"
          >
            {isSyncing ? (
              <LoaderThree size={14} className="text-emerald-500" />
            ) : (
              <RotateCw className="h-3.5 w-3.5 text-zinc-400" />
            )}
            <span className="hidden sm:inline">Sincronizar</span>
          </button>

          {/* Alternador de Tema (Light / Dark) */}
          <button
            onClick={toggleTheme}
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors shadow-sm"
            title={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
            aria-label="Alternar tema"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Divisor Vertical */}
          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-0.5 hidden sm:block" />

          {/* Perfil do Usuário */}
          <div className="flex items-center gap-2.5 pl-1">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-none">
                {userName}
              </div>
              <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                {userRole}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs shadow-sm">
              <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
