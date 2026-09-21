import React from 'react';
import { Users, Briefcase, FileText, Globe, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const pLower = (platform || '').toLowerCase();
  const isFacebook = pLower === 'facebook_groups';
  const isLinkedInPosts = pLower === 'linkedin_posts';

  let Icon = Globe;
  if (isFacebook) Icon = Users;
  else if (isLinkedInPosts) Icon = Share2;
  else if (pLower.includes('linkedin')) Icon = Briefcase;
  else if (pLower.includes('telegram') || pLower.includes('whatsapp')) Icon = MessageCircle;
  else Icon = FileText;

  let label = platform;
  if (isFacebook) label = 'Facebook Groups';
  else if (isLinkedInPosts) label = 'LinkedIn Feed';

  return (
    <span
      className={cn(
        'font-mono text-[11px] px-2 py-0.5 rounded border uppercase flex items-center gap-1.5 shrink-0 transition-colors',
        isFacebook
          ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-500/10 dark:border-blue-500/30 dark:text-blue-400 font-semibold'
          : isLinkedInPosts
          ? 'bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-400 font-semibold'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700/60 font-medium',
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span className="truncate max-w-[120px]">
        {label}
      </span>
    </span>
  );
}

