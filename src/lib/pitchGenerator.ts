import { ProcessedJob, PlatformSource } from '@/types/job';

export interface PitchCandidateContext {
  name?: string | null;
  targetRole?: string | null;
  primaryStack?: string[] | null;
  skills?: string[] | null;
}

/**
 * Normaliza e formata uma lista de tecnologias para apresentação textual limpa.
 * Remove duplicatas, vazios e limita a até 4 itens principais.
 */
function formatTechList(list: string[] | null | undefined, maxItems = 4): string | null {
  if (!list || !Array.isArray(list)) return null;
  const cleaned = Array.from(
    new Set(
      list
        .map((t) => (typeof t === 'string' ? t.trim() : ''))
        .filter((t) => t.length > 0)
    )
  ).slice(0, maxItems);

  if (cleaned.length === 0) return null;
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]} e ${cleaned[1]}`;
  return `${cleaned.slice(0, -1).join(', ')} e ${cleaned[cleaned.length - 1]}`;
}

/**
 * Gera um pitch de abordagem profissional, dinâmico e contextualizado para uma vaga.
 * Segue regras estritas de precedência de dados:
 * 1. Cargo: targetRole -> "posição de [job.title]" -> "desenvolvimento de software"
 * 2. Tecnologias: primary_stack -> skills -> fallback neutro (NUNCA inventa tecnologias)
 * 3. Canal de Abertura: directContact -> linkedin_posts -> facebook_groups -> recrutamento padrão
 */
export function generatePitch(
  job: ProcessedJob | {
    title: string;
    company: string;
    platform?: string;
    url: string;
    directContact?: string | null;
  },
  candidate?: PitchCandidateContext | null
): string {
  const company = job.company ? job.company.trim() : 'Empresa';
  const jobTitle = job.title ? job.title.trim() : 'Oportunidade';

  // 1. ABERTURA CONTEXTUALIZADA PELO CANAL E CONTATO DIRETO
  let introGreeting = '';
  const isDirectContact = Boolean(job.directContact && job.directContact.trim().length > 0);
  const isLinkedinFeed =
    job.platform === PlatformSource.LINKEDIN_POSTS ||
    job.platform === 'linkedin_posts' ||
    /linkedin.*post/i.test(job.platform || '');
  const isFacebookGroup =
    job.platform === PlatformSource.FACEBOOK_GROUPS ||
    job.platform === 'facebook_groups' ||
    /facebook/i.test(job.platform || '');

  if (isDirectContact) {
    introGreeting = `Olá! Vi a oportunidade de ${jobTitle} na ${company} e estou encaminhando minha apresentação diretamente conforme indicado.`;
  } else if (isLinkedinFeed) {
    introGreeting = `Olá! Vi sua publicação no LinkedIn referente à oportunidade de ${jobTitle} e gostaria de apresentar meu perfil.`;
  } else if (isFacebookGroup) {
    introGreeting = `Olá! Vi sua postagem na comunidade referente à oportunidade de ${jobTitle} e me interessei pela vaga.`;
  } else {
    introGreeting = `Olá, time de recrutamento da ${company}!\n\nMe interessei muito pela vaga de ${jobTitle}.`;
  }

  // 2. PRECEDÊNCIA DE CARGO / ESPECIALIDADE
  const rawTargetRole = candidate?.targetRole?.trim();
  let rolePhrase = '';
  if (rawTargetRole) {
    rolePhrase = `Atuo como ${rawTargetRole}`;
  } else if (jobTitle && jobTitle.toLowerCase() !== 'oportunidade') {
    rolePhrase = `Tenho forte interesse em atuar na posição de ${jobTitle}`;
  } else {
    rolePhrase = 'Tenho sólida atuação em desenvolvimento de software';
  }

  // 3. PRECEDÊNCIA DE TECNOLOGIAS (ANTI-ALUCINAÇÃO)
  const primaryStacksFormatted = formatTechList(candidate?.primaryStack);
  const skillsFormatted = formatTechList(candidate?.skills);

  let technicalBody = '';
  if (primaryStacksFormatted) {
    // 1ª Prioridade: primary_stack real do perfil
    technicalBody = `${rolePhrase}, com foco técnico em ${primaryStacksFormatted}, desenvolvendo soluções eficientes, escaláveis e com código limpo.`;
  } else if (skillsFormatted) {
    // 2ª Prioridade: skills reais do perfil
    technicalBody = `${rolePhrase}, com experiência prática em ${skillsFormatted}, prezando sempre por boas práticas, qualidade de entrega e rápida adaptação.`;
  } else {
    // 3ª Prioridade (Fallback Elegante - REQ-06): SEM TECNOLOGIAS ALUCINADAS
    technicalBody = `${rolePhrase}, com sólida vivência na arquitetura de aplicações, desenvolvimento de soluções técnicas e entrega contínua de valor com boas práticas.`;
  }

  // 4. FECHAMENTO & CALL TO ACTION
  let ctaClosing = '';
  if (isDirectContact) {
    ctaClosing = `Fico à total disposição para encaminhar meu currículo detalhado e agendar uma conversa!\n\nContato direto: ${job.directContact}\nLink da vaga: ${job.url}`;
  } else {
    ctaClosing = `Fico à total disposição para conversarmos sobre como posso agregar valor aos desafios da equipe!\n\nLink da vaga: ${job.url}`;
  }

  // Assinatura cordial com nome se fornecido
  const signature = candidate?.name?.trim() ? `\n\nAtenciosamente,\n${candidate.name.trim()}` : '';

  return `${introGreeting}\n\n${technicalBody}\n\n${ctaClosing}${signature}`;
}
