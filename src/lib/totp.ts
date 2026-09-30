import { generateSecret, generateURI, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { AdminRepository } from '@/db/adminRepository';

/**
 * Gera um segredo Base32 aleatório compatível com TOTP RFC 6238.
 */
export function generateTotpSecret(): string {
  return generateSecret();
}

/**
 * Gera a URI no padrão otpauth:// para escaneamento por apps autenticadores.
 */
export function generateTotpUri(
  email: string,
  secret: string,
  issuer: string = 'BuscaVag Admin'
): string {
  return generateURI({
    secret,
    label: email,
    issuer,
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  });
}

/**
 * Gera imagem de QR Code em formato Base64 Data URL (data:image/png;base64,...)
 */
export async function generateQrCodeDataUrl(otpAuthUri: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 240,
    color: {
      dark: '#1f2430', // Navy Velzon
      light: '#ffffff',
    },
  });
}

/**
 * Valida o token numérico de 6 dígitos informado pelo usuário contra o segredo TOTP.
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  const cleanToken = token.trim();
  const cleanSecret = secret.trim();

  try {
    const result = verifySync({
      token: cleanToken,
      secret: cleanSecret,
    });
    return !!result && result.valid === true;
  } catch (err) {
    console.error('[TOTP verify error]:', err);
    return false;
  }
}

/**
 * Avalia se o 2FA está ativado globalmente no sistema.
 * Prioridade: Variável de ambiente ADMIN_TOTP_ENABLED > Registro no banco admin_settings.
 */
export function isTotpEnabledGlobally(): boolean {
  if (process.env.ADMIN_TOTP_ENABLED !== undefined) {
    return process.env.ADMIN_TOTP_ENABLED === 'true';
  }

  try {
    const repo = new AdminRepository();
    const setting = repo.getSetting('totp_enabled');
    return setting === 'true';
  } catch {
    return false;
  }
}
