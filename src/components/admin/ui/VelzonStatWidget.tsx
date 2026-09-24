import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface VelzonStatWidgetProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const variantIconContainers = {
  primary: 'bg-[#405189]/10 text-[#405189] dark:bg-[#405189]/25 dark:text-indigo-300',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  info: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
};

export function VelzonStatWidget({
  title,
  value,
  icon,
  trend,
  variant = 'primary',
  className = '',
}: VelzonStatWidgetProps) {
  return (
    <div
      className={`bg-white dark:bg-[#1f2430] border border-[#e9ebec] dark:border-slate-800 rounded-lg p-5 shadow-2xs flex items-center justify-between gap-4 ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono truncate">
          {title}
        </p>
        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100 font-mono tracking-tight truncate">
          {value}
        </h4>
        {trend && (
          <div className="flex items-center gap-1.5 pt-1 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 font-semibold font-mono ${
                trend.isPositive === true
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : trend.isPositive === false
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500'
              }`}
            >
              {trend.isPositive === true && <TrendingUp className="w-3 h-3" />}
              {trend.isPositive === false && <TrendingDown className="w-3 h-3" />}
              {trend.isPositive === undefined && <Minus className="w-3 h-3" />}
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-slate-400 dark:text-slate-500 truncate">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${variantIconContainers[variant]}`}
      >
        {icon}
      </div>
    </div>
  );
}
