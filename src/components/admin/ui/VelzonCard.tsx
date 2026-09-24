import React from 'react';

interface VelzonCardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

export function VelzonCard({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  noPadding = false,
}: VelzonCardProps) {
  const hasHeader = Boolean(title || subtitle || badge || actions);

  return (
    <div
      className={`bg-white dark:bg-[#1f2430] border border-[#e9ebec] dark:border-slate-800 rounded-lg shadow-2xs overflow-hidden transition-all ${className}`}
    >
      {hasHeader && (
        <div
          className={`px-5 py-4 border-b border-[#e9ebec] dark:border-slate-800/80 flex items-center justify-between gap-4 ${headerClassName}`}
        >
          <div className="space-y-0.5 min-w-0">
            {title && (
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate">
                  {title}
                </h3>
                {badge}
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
