import axios from 'axios';
import { PlatformSource } from '../types/job.js';
export class TelegramScraper {
    name = 'Telegram Channels';
    targetChannels = ['vagas_ti', 'vagasbr', 'vagasdev', 'react_vagas'];
    async scrape() {
        const jobs = [];
        for (const channel of this.targetChannels) {
            try {
                const url = `https://t.me/s/${channel}`;
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    },
                    timeout: 10000,
                });
                const html = response.data;
                // Regex simples para capturar blocos de texto de mensagens do Telegram web preview
                const messageMatches = html.match(/<div class="tgme_widget_message_text[^">]*">([\s\S]*?)<\/div>/g) || [];
                for (const msgHtml of messageMatches) {
                    const cleanText = msgHtml
                        .replace(/<br\s*\/?>/gi, '\n')
                        .replace(/<[^>]+>/g, '')
                        .trim();
                    const lower = cleanText.toLowerCase();
                    // Filtro para capturar apenas posts que mencionam vagas de junior/fullstack
                    if ((lower.includes('full') || lower.includes('stack') || lower.includes('front') || lower.includes('back')) && (lower.includes('jr') || lower.includes('júnior') || lower.includes('junior'))) {
                        const firstLine = cleanText.split('\n')[0] || 'Vaga no Telegram';
                        const title = firstLine.length > 80 ? firstLine.substring(0, 80) + '...' : firstLine;
                        jobs.push({
                            title,
                            company: `@${channel}`,
                            platform: PlatformSource.TELEGRAM,
                            url: `https://t.me/s/${channel}`,
                            description: cleanText,
                            publishedAt: new Date(),
                            location: 'Remoto / Telegram',
                        });
                    }
                }
            }
            catch (err) {
                console.warn(`[TelegramScraper] Erro ao raspar canal @${channel}:`, err.message);
            }
        }
        return jobs;
    }
}
