'use client';

import React from 'react';
import {
  Briefcase,
  DollarSign,
  Tag,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Info,
  Building,
} from 'lucide-react';
import { ProfileData } from './types';

interface ProfileTabProps {
  profile: ProfileData;
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
  skillInput: string;
  setSkillInput: (input: string) => void;
  savingProfile: boolean;
  profileFeedback: { type: 'success' | 'error'; message: string } | null;
  onAddSkill: (e: React.KeyboardEvent | React.MouseEvent) => void;
  onRemoveSkill: (skill: string) => void;
  onToggleWorkModel: (model: string) => void;
  onSaveProfile: (e: React.FormEvent) => void;
}

export function ProfileTab({
  profile,
  setProfile,
  skillInput,
  setSkillInput,
  savingProfile,
  profileFeedback,
  onAddSkill,
  onRemoveSkill,
  onToggleWorkModel,
  onSaveProfile,
}: ProfileTabProps) {
  const ufs = [
    'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
    'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
  ];

  const workModels = ['Remoto', 'Híbrido', 'Presencial'];
  const requiresLocation =
    profile.preferred_work_models.includes('Presencial') ||
    profile.preferred_work_models.includes('Híbrido');

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-6 md:p-8 shadow-xs">
      <div className="mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
          Perfil Profissional & Preferências
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Essas informações alimentam o motor de cálculo semântico para encontrar as oportunidades mais compatíveis com o seu momento de carreira.
        </p>
      </div>

      {profileFeedback && (
        <div
          className={`mb-6 flex items-center gap-2.5 rounded-lg border p-3 text-xs animate-in fade-in duration-200 ${
            profileFeedback.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
              : 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          {profileFeedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{profileFeedback.message}</span>
        </div>
      )}

      <form onSubmit={onSaveProfile} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Cargo Alvo */}
          <div>
            <label htmlFor="target_role" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Cargo Alvo Desejado
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                id="target_role"
                type="text"
                value={profile.target_role || ''}
                onChange={(e) => setProfile({ ...profile, target_role: e.target.value })}
                placeholder="Ex: Desenvolvedor Full Stack, Frontend React"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Senioridade */}
          <div>
            <label htmlFor="seniority" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Senioridade
            </label>
            <select
              id="seniority"
              value={profile.seniority || 'Júnior'}
              onChange={(e) => setProfile({ ...profile, seniority: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors shadow-2xs cursor-pointer"
            >
              <option value="Estágio">Estágio</option>
              <option value="Júnior">Júnior</option>
              <option value="Pleno">Pleno</option>
              <option value="Sênior">Sênior</option>
              <option value="Especialista / Tech Lead">Especialista / Tech Lead</option>
            </select>
          </div>

          {/* Pretensão Salarial */}
          <div>
            <label htmlFor="expected_salary" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Pretensão Salarial Mensal (R$)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                id="expected_salary"
                type="text"
                value={profile.expected_salary || ''}
                onChange={(e) => setProfile({ ...profile, expected_salary: e.target.value })}
                placeholder="Ex: 4500 ou 4.500"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Modelos de Trabalho */}
          <div>
            <span className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Modelos de Trabalho Preferidos
            </span>
            <div className="flex flex-wrap gap-2 pt-0.5">
              {workModels.map((model) => {
                const isSelected = profile.preferred_work_models.includes(model);
                return (
                  <button
                    key={model}
                    type="button"
                    onClick={() => onToggleWorkModel(model)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors shadow-2xs ${
                      isSelected
                        ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                  >
                    {model}
                  </button>
                );
              })}
            </div>

            {requiresLocation && !profile.city && (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Adicione sua cidade abaixo para compatibilidade geográfica precisa em vagas híbridas e presenciais.</span>
              </p>
            )}
          </div>

          {/* Localização (Cidade e UF) */}
          <div className="grid grid-cols-3 gap-2.5 md:col-span-2">
            <div className="col-span-2">
              <label htmlFor="city" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Cidade
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  id="city"
                  type="text"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value || null })}
                  placeholder="Ex: Florianópolis"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors shadow-2xs"
                />
              </div>
            </div>
            <div>
              <label htmlFor="state" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Estado (UF)
              </label>
              <select
                id="state"
                value={profile.state || ''}
                onChange={(e) => setProfile({ ...profile, state: e.target.value || null })}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors shadow-2xs cursor-pointer"
              >
                <option value="">UF</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Habilidades & Tecnologias */}
        <div>
          <label htmlFor="skillInput" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Habilidades & Tecnologias
          </label>
          <div className="flex gap-2 mb-2.5">
            <div className="relative flex-1">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                id="skillInput"
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={onAddSkill}
                placeholder="Ex: TypeScript, React, Node.js, Python, Docker... (Pressione Enter)"
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 pl-9 pr-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={onAddSkill}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 transition-colors shadow-2xs"
            >
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 min-h-[44px] p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            {profile.skills.length === 0 ? (
              <span className="text-xs text-zinc-400 italic">
                Nenhuma habilidade adicionada ainda.
              </span>
            ) : (
              profile.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-800 dark:text-zinc-200 shadow-2xs"
                >
                  <span>{s}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveSkill(s)}
                    aria-label={`Remover tecnologia ${s}`}
                    className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Resumo Profissional / Bio */}
        <div>
          <label htmlFor="bio" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Resumo Profissional / Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            value={profile.bio || ''}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Apresente sua trajetória, projetos mais relevantes e foco de atuação..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors resize-none shadow-2xs"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={savingProfile}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-5 py-2.5 text-xs transition-colors disabled:opacity-50 shadow-xs"
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando Perfil...</span>
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
  );
}
