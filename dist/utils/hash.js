import crypto from 'crypto';
export function normalizeUrl(url) {
    try {
        const parsed = new URL(url);
        // Remove query params irrelevantes como utm_source, tracking ID, etc.
        parsed.search = '';
        return parsed.toString().toLowerCase().replace(/\/$/, '');
    }
    catch {
        return url.trim().toLowerCase();
    }
}
export function generateJobHash(url, company, title) {
    const normalized = `${normalizeUrl(url)}|${company.trim().toLowerCase()}|${title.trim().toLowerCase()}`;
    return crypto.createHash('sha256').update(normalized).digest('hex');
}
