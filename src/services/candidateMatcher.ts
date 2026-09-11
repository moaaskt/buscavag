import { ProcessedJob, RawJob } from '../types/job';

export interface CandidateContext {
  userId: string;
  targetRole?: string | null;
  seniority?: string | null;
  expectedSalary?: string | null;
  preferredWorkModels: string[];
  skills: string[]; // Combined skills from profile + resume
  bio?: string | null;
}

export interface CandidateMatchResult {
  jobId: string;
  overallScore: number; // 0 a 100
  stackScore: number; // 0 a 100
  roleScore: number; // 0 a 100
  seniorityScore: number; // 0 a 100
  locationScore: number; // 0 a 100
  matchedSkills: string[];
  missingSkills: string[];
  matchReasoning: string;
  isStrongMatch: boolean; // score >= 75
}

export interface RankedJobResult {
  job: ProcessedJob | (RawJob & { id: string; overall_score?: number; score_ia?: number });
  match: CandidateMatchResult;
}

export interface MatchFilterOptions {
  minScore?: number;
  search?: string;
  workModel?: string;
  platform?: string;
  limit?: number;
  offset?: number;
}

// Mapeamento de sinônimos e aliases técnicos para normalização precisa
const TECH_SYNONYMS: Record<string, string[]> = {
  'typescript': ['typescript', 'ts'],
  'javascript': ['javascript', 'js', 'ecmascript'],
  'react': ['react', 'react.js', 'reactjs'],
  'next.js': ['next.js', 'nextjs', 'next'],
  'node.js': ['node.js', 'nodejs', 'node'],
  'nestjs': ['nestjs', 'nest.js', 'nest'],
  'express': ['express', 'express.js', 'expressjs'],
  'python': ['python', 'py'],
  'fastapi': ['fastapi', 'fast-api'],
  'django': ['django'],
  'flask': ['flask'],
  'php': ['php'],
  'laravel': ['laravel'],
  'golang': ['golang', 'go lang', '\\bgo\\b'],
  'java': ['java', 'jvm'],
  'spring boot': ['spring boot', 'springboot', 'spring framework', 'spring'],
  'c#': ['c#', 'csharp', '.net', 'dotnet'],
  'c++': ['c\\+\\+', 'cpp'],
  'ruby': ['ruby', 'ruby on rails', 'rails'],
  'vue.js': ['vue', 'vue.js', 'vuejs'],
  'angular': ['angular', 'angularjs', 'angular.js'],
  'tailwind css': ['tailwind', 'tailwind css', 'tailwindcss'],
  'bootstrap': ['bootstrap'],
  'css': ['css', 'css3'],
  'html': ['html', 'html5'],
  'postgresql': ['postgres', 'postgresql', 'pgsql'],
  'mysql': ['mysql'],
  'mongodb': ['mongodb', 'mongo'],
  'sqlite': ['sqlite', 'sqlite3'],
  'redis': ['redis'],
  'supabase': ['supabase'],
  'firebase': ['firebase', 'firestore'],
  'docker': ['docker', 'container', 'containers'],
  'kubernetes': ['kubernetes', 'k8s'],
  'aws': ['aws', 'amazon web services'],
  'google cloud': ['gcp', 'google cloud', 'google cloud platform'],
  'azure': ['azure', 'microsoft azure'],
  'ci/cd': ['ci/cd', 'ci / cd', 'continuous integration', 'github actions', 'gitlab ci'],
  'git': ['git', 'github', 'gitlab'],
  'linux': ['linux', 'unix', 'ubuntu', 'debian'],
  'graphql': ['graphql', 'graph-ql'],
  'rest apis': ['rest', 'rest api', 'rest apis', 'restful'],
  'websockets': ['websocket', 'websockets', 'socket.io', 'ws'],
  'esp32': ['esp32', 'esp-32', 'espressif'],
  'esp8266': ['esp8266', 'esp-8266'],
  'arduino': ['arduino'],
  'raspberry pi': ['raspberry pi', 'raspberry', 'rpi'],
  'mqtt': ['mqtt', 'mosquitto'],
  'iot': ['iot', 'internet das coisas', 'internet of things', 'embarcados', 'embedded'],
};

// Tecnologias comumente extraídas de vagas
const KNOWN_TECH_LIST = Object.keys(TECH_SYNONYMS);

export class CandidateMatcher {
  /**
   * Calcula o score de compatibilidade detalhado de uma vaga para o perfil do candidato.
   */
  public calculateMatch(job: any, candidate: CandidateContext): CandidateMatchResult {
    const jobTitle = (job.title || '').toLowerCase();
    const jobDescription = (job.description || '').toLowerCase();
    const jobLocation = (job.location || '').toLowerCase();
    const fullJobText = `${jobTitle} ${jobDescription} ${jobLocation}`;

    // 1. Cálculo de Aderência de Stack (40% do peso total)
    const candidateSkillsLower = (candidate.skills || []).map((s) => s.trim().toLowerCase());
    const matchedSkillsSet = new Set<string>();
    const missingSkillsSet = new Set<string>();

    // Identifica quais tecnologias conhecidas constam na vaga
    for (const tech of KNOWN_TECH_LIST) {
      const patterns = TECH_SYNONYMS[tech] || [tech];
      const isTechInJob = patterns.some((pat) => {
        const regex = new RegExp(`(?<![a-zA-Z0-9_-])${pat}(?![a-zA-Z0-9_-])`, 'i');
        return regex.test(fullJobText);
      });

      if (isTechInJob) {
        // Verifica se o candidato possui essa tecnologia ou sinônimo
        const candidateHasTech = patterns.some((pat) =>
          candidateSkillsLower.some((cSkill) => cSkill.includes(pat) || pat.includes(cSkill))
        );

        // Formata nome bonito
        const formattedTechName = tech.charAt(0).toUpperCase() + tech.slice(1);

        if (candidateHasTech) {
          matchedSkillsSet.add(formattedTechName);
        } else {
          missingSkillsSet.add(formattedTechName);
        }
      }
    }

    const matchedSkills = Array.from(matchedSkillsSet);
    const missingSkills = Array.from(missingSkillsSet);
    const totalJobSkills = matchedSkills.length + missingSkills.length;

    let stackScore = 70; // Score base inicial
    if (totalJobSkills > 0) {
      const matchRatio = matchedSkills.length / totalJobSkills;
      // Escala ponderada com bônus por quantidade de skills atendidas
      stackScore = Math.min(100, Math.round(matchRatio * 85 + Math.min(matchedSkills.length * 3, 15)));
    } else if (candidateSkillsLower.length > 0) {
      // Se a vaga tem descrição curta e não listou tech explícita, avalia menções genéricas
      let genericMatches = 0;
      for (const skill of candidateSkillsLower) {
        if (fullJobText.includes(skill)) {
          genericMatches++;
          matchedSkills.push(skill);
        }
      }
      stackScore = genericMatches > 0 ? 80 : 50;
    }

    // 2. Cálculo de Alinhamento de Cargo e Título (25% do peso total)
    const targetRoleLower = (candidate.targetRole || 'Desenvolvedor Full Stack').toLowerCase();
    let roleScore = 60;

    const roleKeywords = targetRoleLower.split(/[\s,/]+/).filter((w) => w.length > 2);
    let matchedRoleWords = 0;

    for (const kw of roleKeywords) {
      if (jobTitle.includes(kw)) {
        matchedRoleWords++;
      }
    }

    if (roleKeywords.length > 0) {
      const roleRatio = matchedRoleWords / roleKeywords.length;
      roleScore = Math.round(roleRatio * 100);
    }

    // Bônus para termos genéricos compatíveis
    if (jobTitle.includes('desenvolvedor') || jobTitle.includes('developer') || jobTitle.includes('software') || jobTitle.includes('engenheiro')) {
      roleScore = Math.max(roleScore, 75);
    }
    if ((targetRoleLower.includes('full stack') || targetRoleLower.includes('fullstack')) &&
        (jobTitle.includes('full stack') || jobTitle.includes('fullstack'))) {
      roleScore = 100;
    }
    if ((targetRoleLower.includes('frontend') || targetRoleLower.includes('front-end')) &&
        (jobTitle.includes('frontend') || jobTitle.includes('front-end'))) {
      roleScore = 100;
    }
    if ((targetRoleLower.includes('backend') || targetRoleLower.includes('back-end')) &&
        (jobTitle.includes('backend') || jobTitle.includes('back-end'))) {
      roleScore = 100;
    }
    if (targetRoleLower.includes('iot') && (jobTitle.includes('iot') || jobTitle.includes('hardware') || jobTitle.includes('embarcados'))) {
      roleScore = 100;
    }

    // 3. Cálculo de Compatibilidade de Senioridade (20% do peso total)
    const candidateSeniority = (candidate.seniority || 'Júnior').toLowerCase();
    let seniorityScore = 80; // Padrão se não especificado

    const isJobJunior = /(j[úu]nior|jr\.|est[áa]gio|trainee|iniciante|entry)/i.test(fullJobText);
    const isJobPleno = /(pleno|pl\.|mid-level|intermedi[áa]rio)/i.test(fullJobText);
    const isJobSenior = /(s[êe]nior|sr\.|senior|lead|tech lead|especialista|staff|arquiteto)/i.test(fullJobText);

    if (candidateSeniority.includes('júnior') || candidateSeniority.includes('estágio')) {
      if (isJobJunior) seniorityScore = 100;
      else if (isJobPleno) seniorityScore = 50;
      else if (isJobSenior) seniorityScore = 15;
      else seniorityScore = 85; // Vaga sem nível expresso
    } else if (candidateSeniority.includes('pleno')) {
      if (isJobPleno) seniorityScore = 100;
      else if (isJobJunior) seniorityScore = 80;
      else if (isJobSenior) seniorityScore = 60;
      else seniorityScore = 90;
    } else if (candidateSeniority.includes('sênior') || candidateSeniority.includes('especialista')) {
      if (isJobSenior) seniorityScore = 100;
      else if (isJobPleno) seniorityScore = 80;
      else if (isJobJunior) seniorityScore = 40;
      else seniorityScore = 90;
    }

    // 4. Cálculo de Modelo de Trabalho & Localização (15% do peso total)
    let locationScore = 70;
    const isRemoteJob = /(remoto|remote|home office|teletrabalho|qualquer lugar|anywhere|brasil)/i.test(jobLocation) ||
                        /(remoto|remote|home office)/i.test(jobTitle);

    const prefersRemote = candidate.preferredWorkModels.includes('Remoto');
    const prefersHybrid = candidate.preferredWorkModels.includes('Híbrido');
    const prefersPresential = candidate.preferredWorkModels.includes('Presencial');

    if (isRemoteJob && prefersRemote) {
      locationScore = 100;
    } else if (isRemoteJob && !prefersRemote) {
      locationScore = 60;
    } else if (!isRemoteJob) {
      if (prefersHybrid || prefersPresential) {
        locationScore = 85;
      } else {
        locationScore = 40; // Prefere remoto e a vaga é presencial em outra localidade
      }
    }

    // Fórmula Final Ponderada (0 a 100)
    const overallScore = Math.round(
      stackScore * 0.40 +
      roleScore * 0.25 +
      seniorityScore * 0.20 +
      locationScore * 0.15
    );

    // Geração de Justificativa da IA
    let matchReasoning = '';
    if (overallScore >= 85) {
      matchReasoning = `Altíssima aderência! Você domina as principais competências (${matchedSkills.slice(0, 3).join(', ') || 'da vaga'}) e o perfil de trabalho está em total harmonia.`;
    } else if (overallScore >= 70) {
      matchReasoning = `Boa oportunidade! Forte compatibilidade em ${matchedSkills.slice(0, 2).join(', ') || 'sua stack'}. ${missingSkills.length > 0 ? `Requisito diferencial: ${missingSkills.slice(0, 2).join(', ')}.` : ''}`;
    } else if (overallScore >= 50) {
      matchReasoning = `Compatibilidade moderada. Há sinergia na área de atuação, com oportunidade de expandir conhecimentos em ${missingSkills.slice(0, 2).join(', ') || 'novas ferramentas'}.`;
    } else {
      matchReasoning = `Compatibilidade básica. Vaga voltada para requisitos específicos que divergem da sua stack primária.`;
    }

    return {
      jobId: job.id || '',
      overallScore: Math.max(0, Math.min(100, overallScore)),
      stackScore,
      roleScore,
      seniorityScore,
      locationScore,
      matchedSkills,
      missingSkills,
      matchReasoning,
      isStrongMatch: overallScore >= 75,
    };
  }

  /**
   * Ranqueia uma lista de vagas com base no match do candidato e aplica filtros.
   */
  public rankJobs(jobs: any[], candidate: CandidateContext, options?: MatchFilterOptions): RankedJobResult[] {
    const minScore = options?.minScore ?? 0;
    const search = options?.search?.toLowerCase().trim();
    const workModel = options?.workModel?.toLowerCase().trim();
    const platform = options?.platform?.toLowerCase().trim();

    const results: RankedJobResult[] = [];

    for (const job of jobs) {
      // Filtros básicos prévios
      if (platform && (job.platform || '').toLowerCase() !== platform) {
        continue;
      }

      if (search) {
        const full = `${job.title || ''} ${job.company || ''} ${job.description || ''} ${job.location || ''}`.toLowerCase();
        if (!full.includes(search)) {
          continue;
        }
      }

      if (workModel) {
        const loc = `${job.location || ''} ${job.title || ''}`.toLowerCase();
        if (workModel === 'remoto' && !loc.includes('remoto') && !loc.includes('remote') && !loc.includes('home office')) {
          continue;
        }
        if (workModel === 'presencial' && (loc.includes('remoto') || loc.includes('remote'))) {
          continue;
        }
      }

      const match = this.calculateMatch(job, candidate);

      if (match.overallScore >= minScore) {
        results.push({
          job,
          match,
        });
      }
    }

    // Ordena decrescente por score de compatibilidade geral
    results.sort((a, b) => b.match.overallScore - a.match.overallScore);

    // Paginação se informada
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;

    return results.slice(offset, offset + limit);
  }
}
