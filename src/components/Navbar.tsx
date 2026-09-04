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
import {
  ResizableNavbarContainer,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '@/components/ui/resizable-navbar';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <ResizableNavbarContainer>
      {/* Desktop Navigation */}
      <NavBody>
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:border-emerald-500/40 transition-colors">
            <Compass className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Buscavag
            </span>
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

      {/* Mobile Navigation */}
      <MobileNav>
        <MobileNavHeader>
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Buscavag
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              {isSyncing ? (
                <LoaderThree size={14} className="text-emerald-500" />
              ) : (
                <RotateCw className="h-3.5 w-3.5" />
              )}
            </button>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </div>
        </MobileNavHeader>

        <MobileNavMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <Link
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 w-full p-2.5 rounded-lg text-sm font-medium transition-colors ${
                  item.active
                    ? 'bg-zinc-100 dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="flex items-center justify-between w-full pt-3 mt-1 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
            <span>{userName}</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 p-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{isDarkMode ? 'Claro' : 'Escuro'}</span>
            </button>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </ResizableNavbarContainer>
  );
}
