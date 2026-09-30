'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Lock,
  Mail,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  KeyRound,
  ArrowRight,
  Eye,
  EyeOff,
  Copy,
  Check,
} from 'lucide-react';
import { VelzonModal } from '@/components/admin/ui/VelzonModal';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showTotpInput, setShowTotpInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup 2FA State
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupData, setSetupData] = useState<{
    adminId: string;
    email: string;
    secret: string;
    qrCodeDataUrl: string;
  } | null>(null);
  const [setupCode, setSetupCode] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          totpCode: showTotpInput ? totpCode : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requireTotp) {
          setShowTotpInput(true);
        }
        setError(data.error || 'Falha ao autenticar.');
        return;
      }

      // Requer configuração inicial de 2FA
      if (data.requireSetupTotp) {
        const setupRes = await fetch(`/api/admin/auth/setup-totp?adminId=${data.adminId}`);
        const setupJson = await setupRes.json();
        if (setupJson.success) {
          setSetupData({
            adminId: data.adminId,
            email: data.email,
            secret: setupJson.data.secret,
            qrCodeDataUrl: setupJson.data.qrCodeDataUrl,
          });
          setSetupModalOpen(true);
          return;
        }
      }

      if (data.success) {
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError('Erro de conexão ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupData) return;
    setSetupError(null);
    setSetupLoading(true);

    try {
      const res = await fetch('/api/admin/auth/setup-totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: setupData.adminId,
          secret: setupData.secret,
          totpCode: setupCode,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSetupError(data.error || 'Código inválido. Tente novamente.');
        return;
      }

      setSetupModalOpen(false);
      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setSetupError('Erro ao confirmar configuração de 2FA.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCopySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#f3f3f9] dark:bg-[#141824] flex flex-col justify-center items-center p-4">
      {/* Container Central Velzon */}
      <div className="w-full max-w-md">
        {/* Header do Card */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#405189] text-white shadow-md text-xl font-bold font-mono">
            BV
          </div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            BuscaVag Console Administrativo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Acesso restrito e monitorado a administradores autorizados
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white dark:bg-[#1f2430] border border-[#e9ebec] dark:border-slate-800 rounded-xl shadow-xs p-6 md:p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                E-mail Administrativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@buscavag.com.br"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-[#141824] border border-[#e9ebec] dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#405189] focus:ring-1 focus:ring-[#405189] transition-colors"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                Senha de Acesso
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 dark:bg-[#141824] border border-[#e9ebec] dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#405189] focus:ring-1 focus:ring-[#405189] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo TOTP 2FA (Condicional) */}
            {showTotpInput && (
              <div className="space-y-1.5 pt-1 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#405189] dark:text-indigo-400 font-mono">
                    Código 2FA / TOTP (6 dígitos)
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Google Auth / Authy</span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#405189]">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#405189] focus:ring-1 focus:ring-[#405189] text-center"
                  />
                </div>
              </div>
            )}

            {/* Botão de Submissão */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#405189] hover:bg-[#364574] text-white font-semibold text-xs tracking-wide transition-colors shadow-sm disabled:opacity-50 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando Credenciais...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Rodapé de Segurança */}
          <div className="pt-3 border-t border-[#e9ebec] dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Sessão isolada via admin_session (2h)</span>
          </div>
        </div>
      </div>

      {/* Modal de Configuração de 2FA no Primeiro Acesso */}
      <VelzonModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        title="Configuração de 2FA Obrigatória"
        description="Escaneie o código com seu aplicativo autenticador para proteger sua conta."
        maxWidth="md"
      >
        {setupData && (
          <form onSubmit={handleConfirmSetup} className="space-y-4">
            {setupError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 text-rose-700 text-xs">
                {setupError}
              </div>
            )}

            {/* Exibição do QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg">
              <img
                src={setupData.qrCodeDataUrl}
                alt="QR Code TOTP"
                className="w-48 h-48 rounded"
              />
              <span className="text-[11px] text-slate-400 mt-2 font-mono">
                {setupData.email}
              </span>
            </div>

            {/* Chave Base32 Manual */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 font-mono">
                Chave Manual (Caso não consiga escanear)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={setupData.secret}
                  className="flex-1 py-1.5 px-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300"
                />
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="p-1.5 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  title="Copiar chave secreta"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirmação do Token */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 font-mono">
                Digite o código de 6 dígitos gerado pelo aplicativo:
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={setupCode}
                onChange={(e) => setSetupCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full py-2 text-base font-mono tracking-widest text-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:border-[#405189] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={setupLoading || setupCode.length !== 6}
              className="w-full py-2.5 rounded-lg bg-[#405189] hover:bg-[#364574] text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {setupLoading ? 'Validando...' : 'Ativar 2FA e Entrar no Painel'}
            </button>
          </form>
        )}
      </VelzonModal>
    </div>
  );
}
