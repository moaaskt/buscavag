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
    colorClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  } else if (score >= 70) {
    colorClasses = 'bg-teal-500/15 text-teal-400 border-teal-500/30';
  } else if (score >= 50) {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
  } else {
    colorClasses = 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-sm px-2.5 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-bold',
  }[size];

  const shapeClass = shape === 'rect' ? 'rounded-xl' : 'rounded-full';

  return (
    <div
      className={`inline-flex items-center gap-1 border ${shapeClass} ${colorClasses} ${sizeClasses} backdrop-blur-md`}
    >
      <span className="text-[10px] uppercase font-bold opacity-75">Score:</span>
      <span>{score}%</span>
    </div>
  );
}
