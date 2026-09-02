import OpenAI from 'openai';
import { RawJob } from '../types/job.js';

export interface EvaluationResult {
  isJuniorFullStack: boolean;
  score: number; // 0 - 100
  reasoning: string;
}

export class HermesEvaluator {
  private client: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.HERMES_API_KEY || process.env.OPENAI_API_KEY;
    const baseURL = process.env.HERMES_API_URL || process.env.OPENAI_BASE_URL;

    if (apiKey) {
      this.client = new OpenAI({
        apiKey,
        baseURL: baseURL || undefined,
      });
    }
  }

  public async evaluate(job: RawJob): Promise<EvaluationResult> {
    if (!this.client) {
      return this.evaluateHeuristic(job);
    }

    try {
      const prompt = `
Você é um recrutador técnico especialista avaliando vagas para o perfil de **Moacir Neto** (Dev Full Stack Junior).

**Perfil de Moacir Neto:**
- **Nível:** Junior / Entry Level / Trainee / Sem especificação de nível.
- **Stack Principal:** Node.js, TypeScript, PHP (Laravel / CodeIgniter), NestJS, Express, React, Next.js, JavaScript, Python, Golang, Tailwind CSS, Bootstrap, MySQL, PostgreSQL, Supabase, Docker, REST APIs.

**REGRAS DE LOCALIZAÇÃO E MODELO DE TRABALHO (ESTRITO E PRIORITÁRIO):**
1. **APROVAR REMOTO PRIMEIRO**: Se a vaga for **REMOTA** (contendo "remoto", "remote", "home office", "teletrabalho", "work from home", "anywhere" ou localização genérica "Brasil", "Brazil", "Portugal"), **APROVE A LOCALIZAÇÃO IMEDIATAMENTE** independentemente da cidade indicada.
2. **SE NÃO FOR REMOTA (PRESENCIAL / HÍBRIDO):**
   - **APROVAR**: Presencial ou Híbrido em **Palhoça (SC)** ou **São José (SC)** (Atenção: Rejeitar São José dos Campos/SP).
   - **APROVAR**: Híbrido em **Florianópolis (SC)** ou **Floripa**.
   - **REJEITAR**: Presencial em **Florianópolis (SC)**.
   - **REJEITAR**: Presencial ou Híbrido em qualquer outra cidade (ex: São Paulo, Curitiba, Belo Horizonte, etc.).

**REGRAS DE SENIORIDADE E TOLERÂNCIA TÉCNICA:**
- **REJEITAR** apenas se houver termos explícitos de senioridade avançada: Pleno, Sênior, Sr, Lead, Tech Lead, Staff, Arqueto.
- **NÃO REJEITAR** vagas Jr/Entry level por tecnologias secundárias. Se utilizar JS, TS, Node, React, PHP, Python, Go, SQL, Docker ou APIs, mantenha aprovação ALTA.
- **REJEITAR** apenas perfis completamente desalinhados (ex: COBOL, Swift/iOS nativo exclusivo).

**Vaga a ser analisada:**
- Título: ${job.title}
- Empresa: ${job.company}
- Localização indicada: ${job.location || 'Não informada'}
- Descrição: ${job.description}

Responda APENAS em formato JSON no seguinte modelo:
{
  "isJuniorFullStack": boolean,
  "score": number,
  "reasoning": "Justificativa clara em português indicando adequação de localização, senioridade e stack"
}
`;

      const response = await this.client.chat.completions.create({
        model: process.env.HERMES_MODEL || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return {
          isJuniorFullStack: Boolean(parsed.isJuniorFullStack),
          score: Number(parsed.score) || 0,
          reasoning: String(parsed.reasoning || 'Avaliação via Hermes AI'),
        };
      }
    } catch (err) {
      console.warn(`[HermesEvaluator] Erro na API do Hermes/OpenAI para vaga "${job.title}". Usando fallback de heurística:`, (err as Error).message);
    }

    return this.evaluateHeuristic(job);
  }

  private evaluateHeuristic(job: RawJob): EvaluationResult {
    const text = `${job.title} ${job.description}`.toLowerCase();
    const location = (job.location || '').toLowerCase();
    const titleLower = job.title.toLowerCase();

    // 1. DETECÇÃO PRIORITÁRIA DE TRABALHO REMOTO
    const remoteKeywords = ['remoto', 'remote', 'home office', 'teletrabalho', 'work from home', 'anywhere'];
    const isGenericCountry = location === 'brasil' || location === 'brazil' || location === 'portugal' || location === 'remoto';

    const isRemote = remoteKeywords.some((kw) => location.includes(kw) || titleLower.includes(kw) || text.includes(kw)) || isGenericCountry;

    let isLocationAccepted = false;
    let locationReason = '';

    if (isRemote) {
      isLocationAccepted = true;
      locationReason = 'Modelo Remoto';
    } else {
      // 2. REGRA PARA PRESENCIAL / HÍBRIDO (SE NÃO FOR REMOTO)
      const isHybrid = location.includes('híbrido') || location.includes('hibrido') || text.includes('híbrido') || text.includes('hibrido');
      
      // Desambiguação de São José (SC vs SP/SJC)
      const isSaoJoseCampos = location.includes('dos campos') || location.includes('sjc') || location.includes('sp');
      const isSaoJose = (location.includes('são josé') || location.includes('sao jose')) && !isSaoJoseCampos;
      const isPalhoca = location.includes('palhoça') || location.includes('palhoca');
      const isFlorianopolis = location.includes('florianópolis') || location.includes('florianopolis') || location.includes('floripa');

      if (isPalhoca || isSaoJose) {
        isLocationAccepted = true;
        locationReason = `Presencial/Híbrido em ${isPalhoca ? 'Palhoça (SC)' : 'São José (SC)'}`;
      } else if (isFlorianopolis) {
        if (isHybrid) {
          isLocationAccepted = true;
          locationReason = 'Híbrido em Florianópolis (SC)';
        } else {
          return {
            isJuniorFullStack: false,
            score: 0,
            reasoning: 'Rejeitada via Heurística: Vaga presencial em Florianópolis não aceita.',
          };
        }
      } else {
        return {
          isJuniorFullStack: false,
          score: 0,
          reasoning: `Rejeitada via Heurística: Vaga presencial/híbrida fora de Palhoça/São José(SC)/Florianópolis (${job.location || 'Local externo'}).`,
        };
      }
    }

    // 3. FILTRO DE SENIORIDADE
    const seniorKeywords = ['pleno', 'sênior', 'senior', 'sr.', 'sr ', 'lead', 'lider', 'líder', 'architect', 'arqueto', 'staff', 'principal'];
    const juniorKeywords = ['junior', 'júnior', 'jr', 'entry level', 'iniciante', 'trainee', 'associado', 'associate'];

    const hasSenior = seniorKeywords.some((kw) => text.includes(kw));
    const hasJunior = juniorKeywords.some((kw) => text.includes(kw));

    if (hasSenior && !hasJunior) {
      return {
        isJuniorFullStack: false,
        score: 10,
        reasoning: 'Rejeitada via Heurística: Termos explícitos de nível Pleno/Sênior/Lead no título ou descrição.',
      };
    }

    // 4. TOLERÂNCIA E MATCH DE STACK DO MOACIR NETO
    const targetStack = [
      'node', 'nodejs', 'typescript', 'php', 'laravel', 'codeigniter',
      'nestjs', 'express', 'react', 'next', 'nextjs', 'javascript', 'js', 'ts',
      'python', 'golang', 'go', 'tailwind', 'bootstrap', 'mysql', 'postgres', 'postgresql', 'supabase', 'docker', 'rest', 'sql'
    ];

    const rejectedStack = ['cobol', 'swift', 'objective-c'];

    const matchedStackCount = targetStack.filter((tech) => text.includes(tech)).length;
    const hasRejectedOnly = rejectedStack.some((tech) => text.includes(tech)) && matchedStackCount === 0;

    if (hasRejectedOnly) {
      return {
        isJuniorFullStack: false,
        score: 15,
        reasoning: 'Rejeitada via Heurística: Perfil técnico desalinhado (exclusivo Cobol/iOS Nativo).',
      };
    }

    const fullstackKeywords = ['full stack', 'fullstack', 'full-stack', 'frontend e backend', 'front e back', 'desenvolvedor web', 'software engineer', 'engenheiro de software', 'desenvolvedor'];
    const hasFullStack = fullstackKeywords.some((kw) => text.includes(kw));

    let score = (hasJunior ? 45 : 30) + (hasFullStack ? 35 : 20) + Math.min(matchedStackCount * 5, 25);

    return {
      isJuniorFullStack: score >= 55 && isLocationAccepted,
      score,
      reasoning: `Aprovada via Heurística (${locationReason}): ${hasJunior ? 'Nível Jr/Entry. ' : ''}${hasFullStack ? 'Escopo Web/Full Stack. ' : ''}${matchedStackCount} tecnologias compatíveis.`,
    };
  }
}
