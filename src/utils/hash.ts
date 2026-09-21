import crypto from 'crypto';
import { PlatformSource } from '../types/job';

export function normalizeUrl(url: string, platform?: string): string {
  if (
    platform === PlatformSource.LINKEDIN_POSTS ||
    (url && (url.includes('linkedin.com') || url.includes('urn:li:')))
  ) {
    const urnMatch = url.match(/urn:li:(?:activity|ugcPost):\d+/) || url.match(/activity-(\d+)/);
    if (urnMatch) {
      // Se casou com o grupo numérico do activity-123456, formata para urn:li:activity:123456
      return urnMatch[0].startsWith('urn:')
        ? urnMatch[0]
        : `urn:li:activity:${urnMatch[1]}`;
    }
  }

  try {
    const parsed = new URL(url);
    // Remove query params irrelevantes como utm_source, tracking ID, etc.
    parsed.search = '';
    return parsed.toString().toLowerCase().replace(/\/$/, '');
  } catch {
    return url.trim().toLowerCase();
  }
}

export function generateJobHash(url: string, company: string, title: string, platform?: string): string {
  const isLinkedInPost =
    platform === PlatformSource.LINKEDIN_POSTS ||
    (Boolean(url) && (url.includes('/feed/update/urn:li:') || url.includes('/posts/')));

  if (isLinkedInPost) {
    const normalizedUrn = normalizeUrl(url, PlatformSource.LINKEDIN_POSTS);
    return crypto.createHash('sha256').update(`linkedin_post|${normalizedUrn}`).digest('hex');
  }

  const normalized = `${normalizeUrl(url, platform)}|${company.trim().toLowerCase()}|${title.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
