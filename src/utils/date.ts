const MONTH_MAP: Record<string, number> = {
  jan: 0, janeiro: 0, january: 0,
  fev: 1, fevereiro: 1, february: 1,
  mar: 2, marco: 2, março: 2, march: 2,
  abr: 3, abril: 3, april: 3,
  mai: 4, maio: 4, may: 4,
  jun: 5, junho: 5, june: 5,
  jul: 6, julho: 6, july: 6,
  ago: 7, agosto: 7, august: 7,
  set: 8, setembro: 8, september: 8,
  out: 9, outubro: 9, october: 9,
  nov: 10, novembro: 10, november: 10,
  dez: 11, dezembro: 11, december: 11,
};

export function parseRelativeDate(dateStr?: string | null): Date {
  const now = new Date();
  if (!dateStr || typeof dateStr !== 'string') {
    return now;
  }

  const clean = dateStr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return now;

  // 1. Termos de hoje / agora
  if (
    clean.includes('hoje') ||
    clean.includes('agora') ||
    clean.includes('today') ||
    clean.includes('just now') ||
    clean.includes('minuto') ||
    clean.includes('minute') ||
    clean.includes('hora') ||
    clean.includes('hour') ||
    clean.includes('segundo') ||
    clean.includes('second')
  ) {
    return now;
  }

  // 2. Ontem / Yesterday
  if (clean.includes('ontem') || clean.includes('yesterday')) {
    const d = new Date(now);
    d.setDate(now.getDate() - 1);
    return d;
  }

  // 3. Anteontem
  if (clean.includes('anteontem')) {
    const d = new Date(now);
    d.setDate(now.getDate() - 2);
    return d;
  }

  // 4. Semanas (ex: "há 2 semanas", "2 weeks ago", "1 semana")
  const matchWeeks = clean.match(/(\d+)\s*(semana|sem|week|w)/);
  if (matchWeeks && matchWeeks[1]) {
    const weeks = parseInt(matchWeeks[1], 10);
    const d = new Date(now);
    d.setDate(now.getDate() - weeks * 7);
    return d;
  }

  // 5. Meses (ex: "há 1 mês", "1 month ago")
  const matchMonths = clean.match(/(\d+)\s*(mes|meses|month|m)/);
  if (matchMonths && matchMonths[1]) {
    const months = parseInt(matchMonths[1], 10);
    const d = new Date(now);
    d.setMonth(now.getMonth() - months);
    return d;
  }

  // 6. Dias relativos (ex: "há 3 dias", "publicado há 2 dias", "3d atrás", "4 days ago", "5d")
  const matchDays = clean.match(/(\d+)\s*(dia|dias|day|days|d)/);
  if (matchDays && matchDays[1]) {
    const days = parseInt(matchDays[1], 10);
    const d = new Date(now);
    d.setDate(now.getDate() - days);
    return d;
  }

  // 7. Formato textual por extenso brasileiro (ex: "02 de setembro de 2026", "2 de setembro", "15 de ago")
  const textualMatch = clean.match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)(?:\s+(?:de\s+)?(\d{2,4}))?/);
  if (textualMatch && textualMatch[1] && textualMatch[2]) {
    const day = parseInt(textualMatch[1], 10);
    const monthStr = textualMatch[2];
    const yearStr = textualMatch[3];

    const month = MONTH_MAP[monthStr];
    if (month !== undefined) {
      let year = yearStr ? parseInt(yearStr, 10) : now.getFullYear();
      if (year < 100) year += 2000;
      return new Date(year, month, day);
    }
  }

  // 8. Formato DD/MM/YYYY ou DD/MM/YY ou DD/MM
  const slashMatch = clean.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (slashMatch && slashMatch[1] && slashMatch[2]) {
    const day = parseInt(slashMatch[1], 10);
    const month = parseInt(slashMatch[2], 10) - 1;
    let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    return new Date(year, month, day);
  }

  // 9. ISO 8601 ou padrão Date constructor (ex: "2026-09-02T10:00:00Z", "2026-09-01")
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }

  return now;
}

export function isOlderThanDays(date: Date, maxDays: number = 5): boolean {
  if (!date || isNaN(date.getTime())) {
    return false;
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  // Se a data for no futuro (fuso horário), não é antiga
  if (diffMs < 0) return false;

  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > maxDays;
}
