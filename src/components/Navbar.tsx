'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass,
  Sun,
  Moon,
  LayoutDashboard,
  User,
  Sparkles,
  LogIn,
  Crown,
  UserPlus,
  FileText,
  KanbanSquare,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanvasText } from '@/components/ui/canvas-text';
import {
  ResizableNavbarContainer,
  NavBody,
  NavItems,
} from '@/components/ui/resizable-navbar';
import { FloatingDockMobile, FloatingDockItem } from '@/components/ui/floating-dock';

interface NavbarProps {
  userName?: string;
  userRole?: string;
}

interface AuthUserState {
  authenticated: boolean;
  name?: string;
  email?: string;
  tier?: 'free' | 'premium';
  role?: string;
}

export function Navbar({
  userName: defaultUserName = 'Candidato',
  userRole: defaultUserRole = 'Candidato',
}: NavbarProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname === '/login' || pathname === '/register' || pathname?.startsWith('/login') || pathname?.startsWith('/register');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [authState, setAuthState] = useState<AuthUserState>({ authenticated: false });

  // Carrega e sincroniza o estado do tema e da autenticação
  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.authenticated && data.user) {
        setAuthState({
          authenticated: true,
          name: data.user.name,
          email: data.user.email,
          tier: data.user.tier,
          role: data.user.role,
        });
      } else {
        setAuthState({ authenticated: false });
      }
    } catch {
      setAuthState({ authenticated: false });
    }
  };

  useEffect(() => {
    try {
      const storedTheme = localStorage.getItem('buscavag_theme');
      if (storedTheme === 'light') {
        setIsDarkMode(false);
        document.documentElement.classList.remove('dark');
      } else if (storedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      } else {
        const isDarkDefault = document.documentElement.classList.contains('dark');
        setIsDarkMode(isDarkDefault);
      }
    } catch {
      setIsDarkMode(true);
    }

    if (!isAuthRoute) {
      checkAuth();
    }

    const handleAuthChange = () => {
      if (!isAuthRoute) {
        checkAuth();
      }
    };

    window.addEventListener('buscavag:auth-changed', handleAuthChange);
    return () => {
      window.removeEventListener('buscavag:auth-changed', handleAuthChange);
    };
  }, [isAuthRoute]);

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
      name: 'Vagas Recomendadas (Match IA)',
      link: '/candidate?tab=recommended',
      icon: Sparkles,
      active: pathname.startsWith('/candidate') && (!pathname.includes('tab=profile')),
    },
    {
      name: 'Meu Perfil & CV',
      link: '/candidate?tab=profile',
      icon: FileText,
      active: pathname.startsWith('/candidate') && pathname.includes('tab=profile'),
    },
    {
      name: 'Planos & Preços',
      link: '/pricing',
      icon: Crown,
      active: pathname.startsWith('/pricing'),
    },
    ...(authState.role === 'ADMIN' ? [{
      name: 'Painel Admin',
      link: '/admin',
      icon: ShieldCheck,
      active: pathname.startsWith('/admin'),
    }] : []),
  ];

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle('dark');
    setIsDarkMode(isDark);
    try {
      localStorage.setItem('buscavag_theme', isDark ? 'dark' : 'light');
    } catch {}
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
      title: 'Match IA',
      href: '/candidate',
      icon: <Sparkles className="h-full w-full" />,
      active: pathname.startsWith('/candidate'),
    },
    {
      title: 'Planos',
      href: '/pricing',
      icon: <Crown className="h-full w-full" />,
      active: pathname.startsWith('/pricing'),
    },
    ...(authState.role === 'ADMIN' ? [{
      title: 'Admin',
      href: '/admin',
      icon: <ShieldCheck className="h-full w-full" />,
      active: pathname.startsWith('/admin'),
    }] : []),
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
          {isAuthRoute ? (
            <button
              onClick={toggleTheme}
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors shadow-sm"
              title={isDarkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
              aria-label="Alternar tema"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          ) : authState.authenticated ? (
            <Link
              href="/candidate"
              className="flex h-7 items-center gap-1.5 px-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-medium"
            >
              <User className="h-3.5 w-3.5" />
              <span className="truncate max-w-[80px]">{authState.name?.split(' ')[0] || 'Perfil'}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className="flex items-center gap-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 px-2 py-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium"
              >
                <LogIn className="h-3 w-3" />
                <span>Entrar</span>
              </Link>
              <Link
                href="/register"
                className="flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-xs font-medium transition-colors"
              >
                <UserPlus className="h-3 w-3" />
                <span>Cadastrar</span>
              </Link>
            </div>
          )}
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

          {/* Dynamic Center Navigation Items (ocultos em rotas de auth) */}
          {!isAuthRoute && <NavItems items={navItems} />}

          {/* Right Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
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

            {/* Perfil do Usuário / Botão de Acesso (ocultos em rotas de auth) */}
            {!isAuthRoute && (
              authState.authenticated ? (
                <Link
                  href="/candidate"
                  className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 hover:opacity-85 transition-opacity"
                >
                  <div className="hidden text-right lg:block">
                    <div className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-none">
                      {authState.name || defaultUserName}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono mt-0.5 flex items-center justify-end gap-1">
                      {authState.tier === 'premium' ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                          <Crown className="w-2.5 h-2.5" /> Premium
                        </span>
                      ) : (
                        <span className="text-zinc-400">Plano Free</span>
                      )}
                    </div>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-medium text-xs shadow-sm">
                    <User className="h-3.5 w-3.5" />
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-2 pl-1">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 text-xs font-medium transition-colors shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Entrar</span>
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 text-xs font-medium transition-colors shadow-sm shadow-emerald-600/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Cadastre-se</span>
                  </Link>
                </div>
              )
            )}
          </div>
        </NavBody>
      </ResizableNavbarContainer>

      {/* Floating Dock para Mobile (Responsivo, oculto em rotas de auth) */}
      {!isAuthRoute && <FloatingDockMobile items={mobileDockItems} />}
    </>
  );
}
