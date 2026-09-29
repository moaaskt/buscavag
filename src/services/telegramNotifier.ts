import { Bot } from 'grammy';
import { ProcessedJob } from '../types/job.js';
import { db } from '@/db';
import crypto from 'crypto';

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

  public getStatus() {
    return {
      isConfigured: !!(this.bot && this.chatId),
      chatId: this.chatId ? this.maskChatId(this.chatId) : undefined,
      hasToken: !!process.env.TELEGRAM_BOT_TOKEN,
      mode: (!this.bot || !this.chatId) ? 'mock' : 'live',
    };
  }

  public formatJobMessage(job: ProcessedJob): string {
    const categoryBadge = job.category ? `🏷️ <b>Categoria:</b> ${this.escapeHtml(job.category)}\n` : '';
    
    let scoreBadge = '';
    const scoreVal = job.overallScore ?? job.scoreIa;
    if (scoreVal !== undefined) {
      scoreBadge = `⭐ <b>Score Geral:</b> ${scoreVal}/100\n`;
      if (job.stackScore !== undefined && job.seniorityScore !== undefined && job.locationScore !== undefined) {
        scoreBadge += `   📊 <i>Stack: ${job.stackScore}/100 | Nível: ${job.seniorityScore}/100 | Local: ${job.locationScore}/100</i>\n`;
      }
    }

    let gapsBadge = '';
    if (job.gaps && job.gaps.length > 0) {
      gapsBadge = `⚠️ <b>Gaps / Requisitos adicionais:</b> ${this.escapeHtml(job.gaps.join(', '))}\n`;
    }

    const reasoning = job.aiReasoning ? `💡 <b>Parecer IA:</b> ${this.escapeHtml(job.aiReasoning)}\n` : '';

    return `🚨 <b>NOVA VAGA ENCONTRADA!</b>\n\n` +
           `📌 <b>Título:</b> ${this.escapeHtml(job.title)}\n` +
           `🏢 <b>Empresa:</b> ${this.escapeHtml(job.company)}\n` +
           `🌐 <b>Plataforma:</b> ${job.platform.toUpperCase()}\n` +
           `📍 <b>Local:</b> ${this.escapeHtml(job.location || 'Não especificado')}\n` +
           `📅 <b>Publicado em:</b> ${job.publishedAt.toLocaleDateString('pt-BR')}\n` +
           `${categoryBadge}` +
           `${scoreBadge}` +
           `${gapsBadge}` +
           `${reasoning}\n` +
           `🔗 <a href="${job.url}">Clique aqui para ver a vaga</a>`;
  }

  public async sendMessage(chatId: string, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<{ success: boolean; messageId?: string; mock?: boolean; error?: string }> {
    const targetChat = chatId || this.chatId;
    if (!targetChat) {
      return { success: false, error: 'Chat ID não configurado para envio Telegram.' };
    }

    if (!this.bot || !this.chatId) {
      console.log(`\n[TelegramNotifier MOCK MODE] Mensagem para ${targetChat}:\n${text}\n`);
      const mockId = `mock-tg-${Date.now()}`;
      this.recordDeliveryLog({
        recipient: targetChat,
        status: 'delivered',
        messageId: mockId,
        isMock: true,
        preview: text.slice(0, 150),
      });
      return { success: true, mock: true, messageId: mockId };
    }

    try {
      const res = await this.bot.api.sendMessage(targetChat, text, { parse_mode: parseMode });
      await new Promise((resolve) => setTimeout(resolve, 800));

      this.recordDeliveryLog({
        recipient: targetChat,
        status: 'delivered',
        messageId: String(res.message_id),
        preview: text.slice(0, 150),
      });

      return { success: true, messageId: String(res.message_id) };
    } catch (err: any) {
      const errorMsg = err.message || String(err);
      console.error(`[TelegramNotifier] Erro ao enviar mensagem para ${targetChat}:`, errorMsg);

      this.recordDeliveryLog({
        recipient: targetChat,
        status: 'failed',
        error: errorMsg,
        preview: text.slice(0, 150),
      });

      return { success: false, error: errorMsg };
    }
  }

  public async sendNotification(job: ProcessedJob): Promise<boolean> {
    const message = this.formatJobMessage(job);

    if (!this.bot || !this.chatId) {
      console.log(`[TelegramNotifier MOCK MODE] Notificação gerada para a vaga "${job.title}":\n${message}\n`);
      this.recordDeliveryLog({
        recipient: 'chat_default',
        status: 'delivered',
        messageId: `mock-job-${Date.now()}`,
        isMock: true,
        preview: `Vaga: ${job.title}`,
      });
      return true;
    }

    try {
      const res = await this.bot.api.sendMessage(this.chatId, message, { parse_mode: 'HTML' });
      await new Promise((resolve) => setTimeout(resolve, 800));

      this.recordDeliveryLog({
        recipient: this.chatId,
        status: 'delivered',
        messageId: String(res.message_id),
        preview: `Vaga: ${job.title}`,
      });
      return true;
    } catch (err: any) {
      console.error(`[TelegramNotifier] Erro ao enviar notificação da vaga "${job.title}":`, err);

      this.recordDeliveryLog({
        recipient: this.chatId || 'chat_default',
        status: 'failed',
        error: err.message || String(err),
        preview: `Vaga: ${job.title}`,
      });
      return false;
    }
  }

  public async sendAlert(alertMessage: string): Promise<boolean> {
    const formattedAlert = `⚠️ <b>[ALERTA DE SISTEMA]</b>\n${this.escapeHtml(alertMessage)}`;

    if (!this.bot || !this.chatId) {
      console.warn(`[TelegramNotifier MOCK MODE] Alerta gerado:\n${formattedAlert}\n`);
      this.recordDeliveryLog({
        recipient: 'chat_default',
        status: 'delivered',
        messageId: `mock-alert-${Date.now()}`,
        isMock: true,
        preview: alertMessage.slice(0, 150),
      });
      return true;
    }

    try {
      const res = await this.bot.api.sendMessage(this.chatId, formattedAlert, { parse_mode: 'HTML' });
      await new Promise((resolve) => setTimeout(resolve, 800));

      this.recordDeliveryLog({
        recipient: this.chatId,
        status: 'delivered',
        messageId: String(res.message_id),
        preview: alertMessage.slice(0, 150),
      });
      return true;
    } catch (err: any) {
      console.error(`[TelegramNotifier] Erro ao enviar alerta no Telegram:`, err);

      this.recordDeliveryLog({
        recipient: this.chatId || 'chat_default',
        status: 'failed',
        error: err.message || String(err),
        preview: alertMessage.slice(0, 150),
      });
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

  private maskChatId(id: string): string {
    if (id.length <= 4) return '***';
    return id.slice(0, 3) + '****' + id.slice(-2);
  }

  private recordDeliveryLog(data: {
    recipient: string;
    status: 'delivered' | 'failed';
    messageId?: string;
    error?: string;
    isMock?: boolean;
    preview?: string;
  }) {
    try {
      const logId = crypto.randomUUID();
      const now = new Date().toISOString();

      const metadata = JSON.stringify({
        canal: 'telegram',
        destinatario: data.recipient,
        status: data.status,
        messageId: data.messageId || null,
        error: data.error || null,
        mock: !!data.isMock,
        preview: data.preview || '',
      });

      const nivel = data.status === 'delivered' ? 'info' : 'error';
      const mensagem = data.status === 'delivered'
        ? `[Telegram] Mensagem enviada com sucesso para ${data.recipient}`
        : `[Telegram] Falha no envio para ${data.recipient}: ${data.error || 'Erro desconhecido'}`;

      const stmt = db.prepare(`
        INSERT INTO logs (id, tipo, nivel, origem, mensagem, metadata, created_at)
        VALUES (?, 'mensageria', ?, 'mensageria', ?, ?, ?)
      `);
      stmt.run(logId, nivel, mensagem, metadata, now);
    } catch (err) {
      console.error('[TelegramNotifier] Falha ao registrar log de entrega:', err);
    }
  }
}
