export function parseRelativeDate(dateStr: string): Date {
  const now = new Date();
  const lower = dateStr.toLowerCase().trim();

  if (lower.includes('hoje') || lower.includes('hora') || lower.includes('minuto') || lower.includes('agora')) {
    return now;
  }

  if (lower.includes('ontem')) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return yesterday;
  }

  const matchDays = lower.match(/(\d+)\s*(dia|dias|d)/);
  if (matchDays && matchDays[1]) {
    const days = parseInt(matchDays[1], 10);
    const date = new Date(now);
    date.setDate(now.getDate() - days);
    return date;
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return now;
}

export function isOlderThanDays(date: Date, days: number = 5): boolean {
  const diffTime = Math.abs(new Date().getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > days;
}
