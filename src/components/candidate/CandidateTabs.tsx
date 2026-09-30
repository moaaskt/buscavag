'use client';

import React from 'react';
import { Target, Briefcase, FileText, Bookmark } from 'lucide-react';
import { TabType } from './types';

interface CandidateTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  recommendedCount?: number;
  savedCount?: number;
  hasResume?: boolean;
}

export function CandidateTabs({
  activeTab,
  onTabChange,
  recommendedCount = 0,
  savedCount = 0,
  hasResume = false,
}: CandidateTabsProps) {
  const tabs: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    hasIndicator?: boolean;
  }> = [
    {
      id: 'recommended',
      label: 'Vagas Recomendadas',
      icon: Target,
      count: recommendedCount > 0 ? recommendedCount : undefined,
    },
    {
      id: 'profile',
      label: 'Perfil Profissional',
      icon: Briefcase,
    },
    {
      id: 'resume',
      label: 'Meu Currículo & IA',
      icon: FileText,
      hasIndicator: hasResume,
    },
    {
      id: 'saved',
      label: 'Vagas Salvas',
      icon: Bookmark,
      count: savedCount > 0 ? savedCount : undefined,
    },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-px" aria-label="Abas da Área de Candidato">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-px shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 rounded-t-lg ${
                isActive
                  ? 'border-emerald-600 dark:border-emerald-500 text-zinc-900 dark:text-zinc-50 font-semibold bg-zinc-50/80 dark:bg-zinc-900/50'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500'}`} />
              <span>{tab.label}</span>

              {tab.count !== undefined && (
                <span className="ml-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 px-1.5 py-0.2 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
                  {tab.count}
                </span>
              )}

              {tab.hasIndicator && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0" title="Currículo anexado" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
