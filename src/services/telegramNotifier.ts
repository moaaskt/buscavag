import { Bot } from 'grammy';
import { ProcessedJob } from '../types/job.js';

export class TelegramNotifier {
  private bot: Bot | null = null;
  private chatId: string | null = null;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    this.chatId = process.env.TELEGRAM_CHAT_ID || null;

    if (token) {
      this.bot = new Bot(token);
    }
  }

  public formatJobMessage(job: ProcessedJob): string {
    const scoreBadge = job.scoreIa ? `⭐ <b>Score IA:</b> ${job.scoreIa}/100\n` : '';
    const reasoning = job.aiReasoning ? `💡 <b>Parecer IA:</b> ${job.aiReasoning}\n` : '';

    return `🚨 <b>NOVA VAGA ENCONTRADA!</b>\n\n` +
           `📌 <b>Título:</b> ${this.escapeHtml(job.title)}\n` +
           `🏢 <b>Empresa:</b> ${this.escapeHtml(job.company)}\n` +
           `🌐 <b>Plataforma:</b> ${job.platform.toUpperCase()}\n` +
           `📍 <b>Local:</b> ${this.escapeHtml(job.location || 'Não especificado')}\n` +
           `📅 <b>Publicado em:</b> ${job.publishedAt.toLocaleDateString('pt-BR')}\n` +
           `${scoreBadge}` +
           `${reasoning}\n` +
           `🔗 <a href="${job.url}">Clique aqui para ver a vaga</a>`;
  }

  public async sendNotification(job: ProcessedJob): Promise<boolean> {
    const message = this.formatJobMessage(job);

    if (!this.bot || !this.chatId) {
      console.log(`[TelegramNotifier MOCK MODE] Notificação gerada para a vaga "${job.title}":\n${message}\n`);
      return true;
    }

    try {
      await this.bot.api.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
      // Throttling 800ms entre requisições para evitar rate-limit/ETIMEDOUT
      await new Promise((resolve) => setTimeout(resolve, 800));
      return true;
    } catch (err) {
      console.error(`[TelegramNotifier] Erro ao enviar notificação da vaga "${job.title}":`, err);
      return false;
    }
  }

  public async sendAlert(alertMessage: string): Promise<boolean> {
    const formattedAlert = `⚠️ <b>[ALERTA DE SISTEMA]</b>\n${this.escapeHtml(alertMessage)}`;

    if (!this.bot || !this.chatId) {
      console.warn(`[TelegramNotifier MOCK MODE] Alerta gerado:\n${formattedAlert}\n`);
      return true;
    }

    try {
      await this.bot.api.sendMessage(this.chatId, formattedAlert, { parse_mode: 'HTML' });
      await new Promise((resolve) => setTimeout(resolve, 800));
      return true;
    } catch (err) {
      console.error(`[TelegramNotifier] Erro ao enviar alerta no Telegram:`, err);
      return false;
    }
  }

  public async sendBatchNotifications(jobs: ProcessedJob[]): Promise<number> {
    let sentCount = 0;
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    for (const job of jobs) {
      const success = await this.sendNotification(job);
      if (success) sentCount++;
      await delay(800); // Aguarda 800ms adicionais no envio de lotes
    }
    return sentCount;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
