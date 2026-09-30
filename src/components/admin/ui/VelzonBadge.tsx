import React from 'react';

type VelzonBadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'dark';

interface VelzonBadgeProps {
  children: React.ReactNode;
  variant?: VelzonBadgeVariant;
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<VelzonBadgeVariant, string> = {
  primary:
    'bg-[#405189]/10 text-[#405189] border-[#405189]/25 dark:bg-[#405189]/25 dark:text-indigo-300 dark:border-indigo-800/50',
  success:
    'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/50',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/50',
  danger:
    'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/50',
  info:
    'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/50',
  dark:
    'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function VelzonBadge({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
}: VelzonBadgeProps) {
  const sizeClasses =
    size === 'sm' ? 'px-1.5 py-0.2 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-mono font-semibold border ${sizeClasses} ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
