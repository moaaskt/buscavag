import React from 'react';

interface ScoreBadgeProps {
  score?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ScoreBadge({ score = 0, size = 'md' }: ScoreBadgeProps) {
  let colorClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
  if (score >= 80) {
    colorClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (score >= 60) {
    colorClasses = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  } else if (score >= 40) {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-sm px-2.5 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  }[size];

  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border ${colorClasses} ${sizeClasses} backdrop-blur-md`}
    >
      <span className="text-[10px] uppercase font-bold opacity-75">Score:</span>
      <span>{score}%</span>
    </div>
  );
}
