import { ProcessedJob, RawJob } from '../types/job.js';
import { db } from '@/db';
import crypto from 'crypto';

export type WhatsAppProvider = 'evolution' | 'webhook' | 'meta_cloud' | 'mock';

export interface WhatsAppConfig {
  provider: WhatsAppProvider;
  apiUrl?: string;
  apiKey?: string;
  instance?: string;
  defaultRecipient?: string;
  minScore: number;
  // Meta Cloud API
  metaPhoneNumberId?: string;
  metaToken?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  mock?: boolean;
  error?: string;
  recipient?: string;
}

export class WhatsAppService {
  private config: WhatsAppConfig;

  constructor() {
    const rawProvider = (process.env.WHATSAPP_PROVIDER || '').toLowerCase();
    const apiUrl = process.env.WHATSAPP_API_URL;
    const apiKey = process.env.WHATSAPP_API_KEY;
    const instance = process.env.WHATSAPP_INSTANCE || 'buscavag';
    const defaultRecipient = process.env.WHATSAPP_DEFAULT_RECIPIENT || process.env.WHATSAPP_PHONE_NUMBER;
    const minScore = Number(process.env.WHATSAPP_MIN_SCORE) || 80;

    // Meta Cloud API Credenciais
    const metaPhoneNumberId = process.env.META_PHONE_NUMBER_ID || process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    const metaToken = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_META_TOKEN || process.env.META_API_TOKEN || apiKey;

    let provider: WhatsAppProvider = 'mock';
    if (rawProvider === 'meta_cloud' || rawProvider === 'meta' || rawProvider === 'cloud_api') {
      provider = 'meta_cloud';
    } else if (rawProvider === 'evolution') {
      provider = 'evolution';
    } else if (rawProvider === 'webhook') {
      provider = 'webhook';
    } else if (metaPhoneNumberId && metaToken) {
      provider = 'meta_cloud';
    } else if (apiUrl) {
      // Auto-detect se forneceu URL
      provider = apiUrl.includes('webhook') ? 'webhook' : 'evolution';
    }

    this.config = {
      provider,
      apiUrl,
      apiKey,
      instance,
      defaultRecipient,
      minScore,
      metaPhoneNumberId,
      metaToken,
    };
  }

  /**
   * Retorna o status atual de configuração do serviço.
   */
  public getStatus() {
    const isMetaConfigured = !!(this.config.metaPhoneNumberId && this.config.metaToken);
    const isEvolutionConfigured = !!(this.config.apiUrl && this.config.apiKey);
    const isWebhookConfigured = !!this.config.apiUrl;

    return {
      provider: this.config.provider,
      isConfigured:
        this.config.provider === 'meta_cloud'
          ? isMetaConfigured
          : this.config.provider === 'evolution'
          ? isEvolutionConfigured
          : this.config.provider === 'webhook'
          ? isWebhookConfigured
          : false,
      apiUrl: this.config.apiUrl ? this.maskUrl(this.config.apiUrl) : undefined,
      instance: this.config.instance,
      defaultRecipient: this.config.defaultRecipient ? this.maskPhone(this.config.defaultRecipient) : undefined,
      minScore: this.config.minScore,
      metaPhoneNumberId: this.config.metaPhoneNumberId
        ? this.maskId(this.config.metaPhoneNumberId)
        : undefined,
      isMetaCloudReady: isMetaConfigured,
    };
  }

  /**
   * Gera uma carta de apresentação / pitch profissional conciso em português.
   */
  public generateCoverLetter(
    job: { title: string; company: string; description?: string; gaps?: string[] },
    candidateName = 'Moacir Neto'
  ): string {
    const company = job.company ? job.company.trim() : 'Empresa';
    const title = job.title ? job.title.trim() : 'Desenvolvedor';

    return `Olá, time de recrutamento da ${company}!

Meu nome é ${candidateName} e venho por meio desta apresentar minha candidatura para a posição de ${title}.

Possuo sólida experiência no ecossistema Full Stack moderno (Node.js, TypeScript, React, Next.js, Python, REST APIs e bancos de dados SQL/NoSQL), além de vivência prática em automações de processos e integrações resilientes.

Acredito que meu perfil dinâmico e focado em resolução de problemas tem forte sinergia com os desafios técnicos da ${company}. Fico à total disposição para conversar sobre como posso agregar valor imediato ao time.

Atenciosamente,
${candidateName}`;
  }

  /**
   * Formata a notificação de vaga usando a sintaxe de Markdown oficial do WhatsApp.
   */
  public formatJobAlert(
    job: ProcessedJob | (RawJob & { overall_score?: number; score_ia?: number; overallScore?: number; scoreIa?: number; gaps?: string[]; stackScore?: number; seniorityScore?: number; locationScore?: number; aiReasoning?: string }),
    includeCoverLetter = false,
    candidateName?: string
  ): string {
    const scoreVal = ('overallScore' in job ? job.overallScore : (job as any).overall_score) ??
                     ('scoreIa' in job ? job.scoreIa : (job as any).score_ia) ?? 0;
    
    const published = job.publishedAt ? new Date(job.publishedAt).toLocaleDateString('pt-BR') : 'Recente';
    const location = job.location || 'Remoto / A Combinar';
    const platform = (job.platform || 'WEB').toUpperCase();

    let scoresBreakdown = '';
    if (job.stackScore !== undefined && job.seniorityScore !== undefined && job.locationScore !== undefined) {
      scoresBreakdown = `\n📊 *Métricas de Fit:*\n` +
                        `  • _Stack Técnica:_ ${job.stackScore}/100\n` +
                        `  • _Senioridade:_ ${job.seniorityScore}/100\n` +
                        `  • _Localização:_ ${job.locationScore}/100\n`;
    }

    let gapsText = '';
    if (job.gaps && Array.isArray(job.gaps) && job.gaps.length > 0) {
      gapsText = `\n⚠️ *Gaps / Tecnologias Requeridas:* ${job.gaps.join(', ')}\n`;
    }

    let coverLetterText = '';
    if (includeCoverLetter) {
      const pitch = this.generateCoverLetter({
        title: job.title,
        company: job.company,
        description: job.description,
        gaps: job.gaps,
      }, candidateName);

      coverLetterText = `\n━━━━━━━━━━━━━━━━━━━━\n` +
                        `📝 *Sugestão de Carta de Apresentação:*\n\n` +
                        `${pitch}\n` +
                        `━━━━━━━━━━━━━━━━━━━━\n`;
    }

    return `🚀 *NOVA VAGA TECH COM ALTO MATCH!* 🚀\n\n` +
           `📌 *Vaga:* ${job.title}\n` +
           `🏢 *Empresa:* ${job.company}\n` +
           `🌐 *Plataforma:* ${platform}\n` +
           `📍 *Local:* ${location}\n` +
           `📅 *Data:* ${published}\n` +
           `⭐ *Score Geral IA:* ${Math.round(scoreVal)}/100 (Aderência Alta)` +
           `${scoresBreakdown}` +
           `${gapsText}` +
           `\n🔗 *Link Direto da Vaga:*\n${job.url}\n` +
           `${coverLetterText}` +
           `\n_Notificação gerada pelo Buscavag AI_`;
  }

  /**
   * Envia uma mensagem via WhatsApp para um número específico ou para o destinatário padrão.
   */
  public async sendMessage(recipient: string, text: string): Promise<WhatsAppSendResult> {
    const cleanNumber = this.normalizePhone(recipient || this.config.defaultRecipient || '');

    if (!cleanNumber) {
      return {
        success: false,
        error: 'Destinatário não especificado e sem default configurado em WHATSAPP_DEFAULT_RECIPIENT.',
      };
    }

    // Modo MOCK / Fallback para desenvolvimento
    const isMock =
      this.config.provider === 'mock' ||
      (this.config.provider === 'meta_cloud' && (!this.config.metaPhoneNumberId || !this.config.metaToken)) ||
      ((this.config.provider === 'evolution' || this.config.provider === 'webhook') && !this.config.apiUrl);

    if (isMock) {
      console.log(`\n======================================================`);
      console.log(`[WhatsAppService MOCK MODE]`);
      console.log(`Para: ${cleanNumber}`);
      console.log(`Provedor: ${this.config.provider}`);
      console.log(`Mensagem:\n${text}`);
      console.log(`======================================================\n`);

      const mockId = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.recordDeliveryLog({
        canal: 'whatsapp',
        provider: this.config.provider,
        recipient: cleanNumber,
        status: 'delivered',
        messageId: mockId,
        isMock: true,
        preview: text.slice(0, 150),
      });

      return {
        success: true,
        mock: true,
        messageId: mockId,
        recipient: cleanNumber,
      };
    }

    try {
      let sendResult: WhatsAppSendResult;
      if (this.config.provider === 'meta_cloud') {
        sendResult = await this.sendMetaCloudMessage(cleanNumber, text);
      } else if (this.config.provider === 'evolution') {
        sendResult = await this.sendEvolutionMessage(cleanNumber, text);
      } else if (this.config.provider === 'webhook') {
        sendResult = await this.sendWebhookMessage(cleanNumber, text);
      } else {
        return {
          success: false,
          error: `Provedor desconhecido: ${this.config.provider}`,
        };
      }

      this.recordDeliveryLog({
        canal: 'whatsapp',
        provider: this.config.provider,
        recipient: cleanNumber,
        status: sendResult.success ? 'delivered' : 'failed',
        messageId: sendResult.messageId,
        error: sendResult.error,
        preview: text.slice(0, 150),
      });

      return sendResult;
    } catch (err) {
      const errorMsg = (err as Error).message || String(err);
      console.error(`[WhatsAppService] Falha ao enviar mensagem para ${cleanNumber}:`, errorMsg);

      this.recordDeliveryLog({
        canal: 'whatsapp',
        provider: this.config.provider,
        recipient: cleanNumber,
        status: 'failed',
        error: errorMsg,
        preview: text.slice(0, 150),
      });

      return {
        success: false,
        error: errorMsg,
        recipient: cleanNumber,
      };
    }
  }

  /**
   * Envia alerta de vaga específica via WhatsApp caso o score supere o threshold.
   */
  public async sendJobNotification(
    job: ProcessedJob,
    recipient?: string,
    options?: { force?: boolean; includeCoverLetter?: boolean; candidateName?: string }
  ): Promise<WhatsAppSendResult> {
    const scoreVal = (job.overallScore ?? job.scoreIa) ?? 0;
    const force = options?.force ?? false;

    if (!force && scoreVal < this.config.minScore) {
      return {
        success: false,
        error: `Score da vaga (${scoreVal}) inferior ao threshold mínimo para WhatsApp (${this.config.minScore}).`,
      };
    }

    const message = this.formatJobAlert(job, options?.includeCoverLetter, options?.candidateName);
    const targetRecipient = recipient || this.config.defaultRecipient || '';

    return await this.sendMessage(targetRecipient, message);
  }

  // ================= Privates de Envio =================

  /**
   * Envio direto pela Meta Cloud API Oficial (graph.facebook.com/v18.0)
   */
  private async sendMetaCloudMessage(number: string, text: string): Promise<WhatsAppSendResult> {
    const phoneNumberId = this.config.metaPhoneNumberId;
    const token = this.config.metaToken;

    if (!phoneNumberId || !token) {
      throw new Error('Credenciais da Meta Cloud API ausentes (META_PHONE_NUMBER_ID ou META_WHATSAPP_TOKEN).');
    }

    const endpoint = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };

    const body = JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: number,
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Meta Cloud API retornou HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const msgId = data?.messages?.[0]?.id || `meta-${Date.now()}`;

    return {
      success: true,
      messageId: msgId,
      recipient: number,
    };
  }

  private async sendEvolutionMessage(number: string, text: string): Promise<WhatsAppSendResult> {
    const baseUrl = (this.config.apiUrl || '').replace(/\/$/, '');
    const instance = this.config.instance || 'buscavag';
    const endpoint = `${baseUrl}/message/sendText/${instance}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['apikey'] = this.config.apiKey;
    }

    const body = JSON.stringify({
      number,
      text,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Evolution API retornou HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.key?.id || data.id || `evolution-${Date.now()}`,
      recipient: number,
    };
  }

  private async sendWebhookMessage(number: string, text: string): Promise<WhatsAppSendResult> {
    const endpoint = this.config.apiUrl!;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const body = JSON.stringify({
      to: number,
      message: text,
      timestamp: new Date().toISOString(),
      source: 'buscavag',
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Webhook HTTP retornou HTTP ${response.status}: ${errText}`);
    }

    return {
      success: true,
      messageId: `webhook-${Date.now()}`,
      recipient: number,
    };
  }

  private recordDeliveryLog(data: {
    canal: 'whatsapp' | 'telegram';
    provider: string;
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
        canal: data.canal,
        provider: data.provider,
        destinatario: data.recipient,
        status: data.status,
        messageId: data.messageId || null,
        error: data.error || null,
        mock: !!data.isMock,
        preview: data.preview || '',
      });

      const nivel = data.status === 'delivered' ? 'info' : 'error';
      const mensagem = data.status === 'delivered'
        ? `[WhatsApp] Mensagem enviada com sucesso para ${data.recipient} via ${data.provider}`
        : `[WhatsApp] Falha no envio para ${data.recipient} via ${data.provider}: ${data.error || 'Erro desconhecido'}`;

      const stmt = db.prepare(`
        INSERT INTO logs (id, tipo, nivel, origem, mensagem, metadata, created_at)
        VALUES (?, 'mensageria', ?, 'mensageria', ?, ?, ?)
      `);
      stmt.run(logId, nivel, mensagem, metadata, now);
    } catch (err) {
      console.error('[WhatsAppService] Falha ao registrar log de entrega:', err);
    }
  }

  private normalizePhone(phone: string): string {
    // Remove todos os caracteres não numéricos
    let digits = phone.replace(/\D/g, '');
    // Se começar com 0, remove
    if (digits.startsWith('0')) {
      digits = digits.slice(1);
    }
    return digits;
  }

  private maskPhone(phone: string): string {
    const clean = this.normalizePhone(phone);
    if (clean.length <= 4) return '***';
    return clean.slice(0, 4) + '****' + clean.slice(-2);
  }

  private maskId(id: string): string {
    if (id.length <= 6) return '***';
    return id.slice(0, 3) + '***' + id.slice(-3);
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}/***`;
    } catch {
      return 'http://***';
    }
  }
}

// Instância singleton para uso em rotas e serviços
export const whatsappService = new WhatsAppService();
