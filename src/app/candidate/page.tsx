'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  FileText,
  Bookmark,
  Sparkles,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Crown,
  Briefcase,
  DollarSign,
  Layers,
  MapPin,
  Save,
  Loader2,
  LogOut,
  FileUp,
  Tag,
  Clock,
  ShieldAlert,
  Zap,
  Check,
  Award,
  Lightbulb,
  Cpu
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { cn } from '@/lib/utils';

interface UserData {
  id: string;
  name: string;
  email: string;
  tier: 'free' | 'premium';
}

interface ProfileData {
  target_role: string | null;
  seniority: string | null;
  expected_salary: string | null;
  preferred_work_models: string[];
  skills: string[];
  bio: string | null;
}

interface CVAnalysisData {
  detected_role: string;
  detected_seniority: string;
  hard_skills: string[];
  soft_skills: string[];
  summary: string;
  strengths: string[];
  improvement_tips: string[];
  source?: string;
}

interface ResumeData {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  ai_analysis?: CVAnalysisData | null;
  analyzedAt?: string | null;
}

interface SavedJob {
  user_id: string;
  job_id: string;
  status: string;
  saved_at: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string | null;
    url: string;
    platform: string;
    published_at: string;
    score_ia: number;
    overall_score: number;
  };
}

export default function CandidateDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'resume' | 'saved'>('profile');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);

  // Profile State
  const [profile, setProfile] = useState<ProfileData>({
    target_role: '',
    seniority: 'Júnior',
    expected_salary: '',
    preferred_work_models: ['Remoto'],
    skills: [],
    bio: '',
  });
  const [skillInput, setSkillInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Resume State
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [analyzingResume, setAnalyzingResume] = useState(false);
  const [syncingSkills, setSyncingSkills] = useState(false);
  const [resumeFeedback, setResumeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Saved Jobs State
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Carregar dados iniciais da sessão
  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me');
      const data = await res.json();

      if (!data.authenticated || !data.user) {
        router.push('/login');
        return;
      }

      setUser(data.user);
      if (data.profile) {
        setProfile({
          target_role: data.profile.target_role || '',
          seniority: data.profile.seniority || 'Júnior',
          expected_salary: data.profile.expected_salary || '',
          preferred_work_models: data.profile.preferred_work_models || ['Remoto'],
          skills: data.profile.skills || [],
          bio: data.profile.bio || '',
        });
      }
      if (data.resume) {
        setResume({
          ...data.resume,
          ai_analysis: data.resume.ai_analysis || null,
          analyzedAt: data.resume.analyzed_at || null,
        });
      }
    } catch (err) {
      console.error('Failed to load session:', err);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await fetch('/api/candidate/saved-jobs');
      const data = await res.json();
      if (data.success) {
        setSavedJobs(data.savedJobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch saved jobs:', err);
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedJobs();
    }
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.dispatchEvent(new CustomEvent('buscavag:auth-changed'));
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // --- Funções do Perfil ---
  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed && !profile.skills.includes(trimmed)) {
      setProfile((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const toggleWorkModel = (model: string) => {
    setProfile((prev) => {
      const exists = prev.preferred_work_models.includes(model);
      return {
        ...prev,
        preferred_work_models: exists
          ? prev.preferred_work_models.filter((m) => m !== model)
          : [...prev.preferred_work_models, model],
      };
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileFeedback(null);

    try {
      const res = await fetch('/api/candidate/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setProfileFeedback({ type: 'success', message: 'Perfil atualizado com sucesso!' });
        setTimeout(() => setProfileFeedback(null), 4000);
      } else {
        setProfileFeedback({ type: 'error', message: data.error || 'Erro ao salvar perfil' });
      }
    } catch {
      setProfileFeedback({ type: 'error', message: 'Erro de comunicação ao salvar perfil' });
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Funções de Currículo ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('resume', file);

    setUploadingResume(true);
    setResumeFeedback(null);

    try {
      const res = await fetch('/api/candidate/resume', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResume({
          id: data.resume.id,
          filename: data.resume.filename,
          fileSize: data.resume.file_size,
          fileType: data.resume.file_type,
          uploadedAt: data.resume.uploaded_at,
          ai_analysis: null,
          analyzedAt: null,
        });
        setResumeFeedback({ type: 'success', message: 'Currículo enviado com sucesso!' });
        setTimeout(() => setResumeFeedback(null), 4000);
      } else {
        setResumeFeedback({ type: 'error', message: data.error || 'Erro no upload' });
      }
    } catch {
      setResumeFeedback({ type: 'error', message: 'Erro de comunicação no upload' });
    } finally {
      setUploadingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resume) return;

    setAnalyzingResume(true);
    setResumeFeedback(null);

    try {
      const res = await fetch('/api/candidate/analyze-cv', {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setResume((prev) => (prev ? { ...prev, ai_analysis: data.analysis, analyzedAt: data.analyzedAt } : null));
        setResumeFeedback({ type: 'success', message: 'Análise por IA concluída com sucesso!' });
        setTimeout(() => setResumeFeedback(null), 5000);
      } else {
        setResumeFeedback({ type: 'error', message: data.error || 'Erro ao processar análise' });
      }
    } catch (err: any) {
      setResumeFeedback({ type: 'error', message: 'Erro de comunicação com o servidor de IA' });
    } finally {
      setAnalyzingResume(false);
    }
  };

  const handleSyncSkills = async (skillsToSync: string[], detectedRole?: string, detectedSeniority?: string) => {
    if (!skillsToSync || skillsToSync.length === 0) return;

    setSyncingSkills(true);
    setSyncFeedback(null);

    try {
      const res = await fetch('/api/candidate/sync-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: skillsToSync,
          detectedRole,
          detectedSeniority,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.profile) {
          setProfile({
            target_role: data.profile.target_role || profile.target_role,
            seniority: data.profile.seniority || profile.seniority,
            expected_salary: data.profile.expected_salary || profile.expected_salary,
            preferred_work_models: data.profile.preferred_work_models || profile.preferred_work_models,
            skills: data.profile.skills || profile.skills,
            bio: data.profile.bio || profile.bio,
          });
        }
        setSyncFeedback('Habilidades sincronizadas com o seu perfil com sucesso!');
        setTimeout(() => setSyncFeedback(null), 4000);
      } else {
        setSyncFeedback(data.error || 'Falha ao sincronizar');
      }
    } catch {
      setSyncFeedback('Erro de comunicação ao sincronizar habilidades');
    } finally {
      setSyncingSkills(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm('Deseja realmente remover seu currículo?')) return;

    try {
      const res = await fetch('/api/candidate/resume', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setResume(null);
        setResumeFeedback({ type: 'success', message: 'Currículo removido com sucesso' });
        setTimeout(() => setResumeFeedback(null), 4000);
      }
    } catch {
      setResumeFeedback({ type: 'error', message: 'Erro ao remover currículo' });
    }
  };

  // --- Funções de Vagas Salvas ---
  const handleToggleJob = async (jobId: string, currentStatus: string) => {
    try {
      const res = await fetch('/api/candidate/saved-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: currentStatus }),
      });
      const data = await res.json();
      if (data.success && !data.isSaved) {
        setSavedJobs((prev) => prev.filter((item) => item.job_id !== jobId));
      }
    } catch (err) {
      console.error('Error toggling job:', err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-emerald-400 font-mono text-sm">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Carregando painel do candidato...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        {/* User Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-xl mb-8">
          <div className="absolute top-0 right-0 h-48 w-48 bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner">
                <User className="h-8 w-8" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                    {user?.name}
                  </h1>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider',
                      user?.tier === 'premium'
                        ? 'border border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border border-zinc-700 bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {user?.tier === 'premium' ? (
                      <>
                        <Crown className="w-3 h-3 text-amber-400" />
                        <span>Premium</span>
                      </>
                    ) : (
                      <span>Free</span>
                    )}
                  </span>
                </div>
                <p className="text-sm text-zinc-400 mt-1 font-mono">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {user?.tier === 'free' && (
                <div className="hidden sm:flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-1.5 text-xs text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Match com IA ilimitado disponível em breve</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 hover:bg-rose-950/20 transition-all active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 flex border-b border-zinc-800 gap-2 overflow-x-auto pb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0',
                activeTab === 'profile'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Briefcase className="w-4 h-4" />
              <span>Perfil Profissional</span>
            </button>

            <button
              onClick={() => setActiveTab('resume')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0',
                activeTab === 'resume'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              )}
            >
              <FileText className="w-4 h-4" />
              <span>Meu Currículo & IA</span>
              {resume && (
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('saved')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px shrink-0',
                activeTab === 'saved'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              )}
            >
              <Bookmark className="w-4 h-4" />
              <span>Vagas Salvas</span>
              {savedJobs.length > 0 && (
                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">
                  {savedJobs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab 1: Perfil Profissional */}
        {activeTab === 'profile' && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-xl">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                <span>Preferências de Carreira & Stack</span>
              </h2>
              <p className="text-sm text-zinc-400 mt-1">
                Configure os critérios que o motor de inteligência artificial usará para calcular seu match
              </p>
            </div>

            {profileFeedback && (
              <div
                className={cn(
                  'mb-6 flex items-center gap-2.5 rounded-lg border p-3 text-sm animate-in fade-in duration-200',
                  profileFeedback.type === 'success'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                )}
              >
                {profileFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{profileFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-2">
                    Cargo Alvo Desejado
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={profile.target_role || ''}
                      onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                      placeholder="Ex: Desenvolvedor Full Stack, Frontend React"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-2">
                    Senioridade
                  </label>
                  <select
                    value={profile.seniority || 'Júnior'}
                    onChange={(e) => setProfile({ ...profile, seniority: e.target.value })}
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  >
                    <option value="Estágio">Estágio</option>
                    <option value="Júnior">Júnior</option>
                    <option value="Pleno">Pleno</option>
                    <option value="Sênior">Sênior</option>
                    <option value="Especialista / Tech Lead">Especialista / Tech Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-2">
                    Pretensão Salarial Mensal (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={profile.expected_salary || ''}
                      onChange={(e) => setProfile({ ...profile, expected_salary: e.target.value })}
                      placeholder="Ex: 4.500 - 6.000 ou 5.000 CLT"
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-zinc-300 mb-2">
                    Modelos de Trabalho Preferidos
                  </label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['Remoto', 'Híbrido', 'Presencial'].map((model) => {
                      const selected = profile.preferred_work_models.includes(model);
                      return (
                        <button
                          type="button"
                          key={model}
                          onClick={() => toggleWorkModel(model)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                            selected
                              ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                              : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                          )}
                        >
                          {model}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-2">
                  Habilidades & Tecnologias (Pressione Enter para adicionar)
                </label>
                <div className="flex gap-2 mb-3">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Ex: TypeScript, React, Node.js, Python, Docker..."
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[42px] p-3 rounded-lg border border-zinc-800/80 bg-zinc-950/40">
                  {profile.skills.length === 0 ? (
                    <span className="text-xs text-zinc-500 italic">
                      Nenhuma habilidade adicionada ainda.
                    </span>
                  ) : (
                    profile.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 font-mono"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="hover:text-rose-400 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 mb-2">
                  Resumo Profissional / Bio
                </label>
                <textarea
                  rows={4}
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Conte um pouco sobre sua trajetória, projetos principais e objetivos de carreira..."
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold px-6 py-2.5 text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-950/40"
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Salvar Perfil</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Meu Currículo & Análise de IA */}
        {activeTab === 'resume' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-xl">
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    <span>Upload e Gerenciamento de Currículo</span>
                  </h2>
                  <p className="text-sm text-zinc-400 mt-1">
                    Envie seu currículo em PDF ou Word para o pipeline de análise automática por IA
                  </p>
                </div>

                {resume && (
                  <button
                    type="button"
                    onClick={handleAnalyzeResume}
                    disabled={analyzingResume}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-semibold px-4 py-2.5 text-xs shadow-lg shadow-emerald-950/50 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {analyzingResume ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analisando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-zinc-950" />
                        <span>{resume.ai_analysis ? 'Reanalisar com IA' : 'Analisar Currículo com IA'}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {resumeFeedback && (
                <div
                  className={cn(
                    'mb-6 flex items-center gap-2.5 rounded-lg border p-3 text-sm animate-in fade-in duration-200',
                    resumeFeedback.type === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  )}
                >
                  {resumeFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{resumeFeedback.message}</span>
                </div>
              )}

              {resume ? (
                <div className="space-y-6">
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-zinc-100">{resume.filename}</h3>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 font-mono">
                          <span>{formatBytes(resume.fileSize)}</span>
                          <span>•</span>
                          <span>Enviado em {new Date(resume.uploadedAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf,.docx,.doc"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingResume}
                        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors"
                      >
                        <FileUp className="w-4 h-4" />
                        <span>Substituir Arquivo</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteResume}
                        className="flex items-center gap-2 rounded-lg border border-rose-900/50 bg-rose-950/30 hover:bg-rose-900/50 px-3.5 py-2 text-xs font-medium text-rose-300 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>

                  {!resume.ai_analysis && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0">
                          <Cpu className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-emerald-300">
                            Pronto para Análise de Inteligência Artificial
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                            Clique em &quot;Analisar Currículo com IA&quot; para extrair automaticamente seu nível de senioridade, stack de tecnologias, resumo executivo e dicas para sistemas ATS.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAnalyzeResume}
                        disabled={analyzingResume}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold px-4 py-2 text-xs transition-colors shrink-0 flex items-center gap-2"
                      >
                        {analyzingResume ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Executar Análise</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 rounded-2xl p-12 text-center bg-zinc-950/30 hover:bg-emerald-500/5 transition-all duration-200 group"
                  >
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
                      {uploadingResume ? (
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                      ) : (
                        <UploadCloud className="w-8 h-8" />
                      )}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-zinc-200">
                      {uploadingResume ? 'Processando envio...' : 'Clique para selecionar seu currículo'}
                    </h3>
                    <p className="mt-1.5 text-xs text-zinc-500 max-w-sm mx-auto">
                      Suporta arquivos nos formatos <strong>PDF</strong> (.pdf) ou <strong>Word</strong> (.docx, .doc) de até 10MB.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Painel de Resultados da Análise de IA */}
            {resume?.ai_analysis && (
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-zinc-800/80 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-mono text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Diagnóstico de IA do Currículo</span>
                      </span>
                      {resume.ai_analysis.source && (
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          • {resume.ai_analysis.source}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mt-2">
                      {resume.ai_analysis.detected_role}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
                        Senioridade Detectada
                      </div>
                      <span className="inline-block mt-0.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300 font-mono">
                        {resume.ai_analysis.detected_seniority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Resumo Executivo */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                  <h4 className="text-xs font-mono uppercase text-zinc-400 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>Resumo Executivo do Perfil</span>
                  </h4>
                  <p className="text-sm text-zinc-200 leading-relaxed">
                    {resume.ai_analysis.summary}
                  </p>
                </div>

                {/* Hard Skills Detectadas */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                    <h4 className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <span>Hard Skills & Tecnologias Identificadas ({resume.ai_analysis.hard_skills.length})</span>
                    </h4>

                    <button
                      type="button"
                      onClick={() =>
                        handleSyncSkills(
                          resume.ai_analysis?.hard_skills || [],
                          resume.ai_analysis?.detected_role,
                          resume.ai_analysis?.detected_seniority
                        )
                      }
                      disabled={syncingSkills}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-3 py-1.5 text-xs font-medium transition-all active:scale-95 disabled:opacity-50 self-start sm:self-auto"
                    >
                      {syncingSkills ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Sincronizar com Meu Perfil</span>
                    </button>
                  </div>

                  {syncFeedback && (
                    <div className="mb-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300 font-mono animate-in fade-in">
                      {syncFeedback}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {resume.ai_analysis.hard_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 font-mono"
                      >
                        <span>{skill}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pontos Fortes e Dicas de Melhoria ATS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pontos Fortes */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                    <h4 className="text-xs font-mono uppercase text-zinc-400 mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Pontos Fortes Identificados</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {resume.ai_analysis.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recomendações ATS */}
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5">
                    <h4 className="text-xs font-mono uppercase text-zinc-400 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span>Otimizações para Vagas & ATS</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {resume.ai_analysis.improvement_tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 leading-relaxed">
                          <span className="text-amber-400 font-bold shrink-0">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Vagas Salvas */}
        {activeTab === 'saved' && (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:p-8 backdrop-blur-xl">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <span>Minhas Vagas Salvas</span>
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Gerencie as oportunidades de interesse favoritadas nas buscas
                </p>
              </div>

              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-semibold px-4 py-2 text-xs transition-colors self-start md:self-auto"
              >
                <span>Explorar Mais Vagas</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loadingJobs ? (
              <div className="py-12 text-center text-zinc-400 font-mono text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Carregando vagas salvas...</span>
              </div>
            ) : savedJobs.length === 0 ? (
              <div className="py-16 text-center border border-zinc-800/80 rounded-xl bg-zinc-950/40 p-8">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-medium text-zinc-300">Nenhuma vaga salva ainda</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Acesse o Explorador de Vagas e clique no botão de salvar para acompanhar suas oportunidades aqui.
                </p>
                <Link
                  href="/jobs"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-medium text-zinc-200 transition-colors"
                >
                  Ir para o Explorador
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedJobs.map((item) => (
                  <div
                    key={item.job_id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="inline-block rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400 uppercase">
                          {item.job.platform}
                        </span>
                        <button
                          onClick={() => handleToggleJob(item.job_id, item.status)}
                          className="text-zinc-500 hover:text-rose-400 transition-colors p-1"
                          title="Remover vaga salva"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <h3 className="text-base font-semibold text-zinc-100 mt-2 line-clamp-1">
                        {item.job.title}
                      </h3>
                      <p className="text-sm text-zinc-400 mt-0.5">{item.job.company}</p>

                      <div className="flex items-center gap-4 text-xs text-zinc-500 mt-3">
                        {item.job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[150px]">{item.job.location}</span>
                          </div>
                        )}
                        {item.job.published_at && (
                          <div className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(item.job.published_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-zinc-800/80 flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400">
                        Score IA: {item.job.score_ia || item.job.overall_score || 0}%
                      </span>

                      <a
                        href={item.job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 text-xs font-medium transition-colors"
                      >
                        <span>Ver Vaga</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
