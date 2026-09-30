import React from 'react';

interface ScoreBadgeProps {
  score?: number;
  size?: 'sm' | 'md' | 'lg';
  /** 'pill' = rounded-full (default), 'rect' = rounded-xl */
  shape?: 'pill' | 'rect';
}

export function ScoreBadge({ score = 0, size = 'md', shape = 'pill' }: ScoreBadgeProps) {
  let colorClasses: string;
  if (score >= 85) {
    colorClasses = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60';
  } else if (score >= 70) {
    colorClasses = 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/60';
  } else if (score >= 50) {
    colorClasses = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60';
  } else {
    colorClasses = 'bg-zinc-100 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  }[size];

  const shapeClass = shape === 'rect' ? 'rounded-md' : 'rounded-full';

  return (
    <div
      className={`inline-flex items-center gap-1 border ${shapeClass} ${colorClasses} ${sizeClasses} shrink-0 transition-colors`}
    >
      <span className="text-[10px] uppercase font-semibold tracking-wider opacity-70">Match</span>
      <span className="font-mono font-bold">{score}%</span>
    </div>
  );
}
