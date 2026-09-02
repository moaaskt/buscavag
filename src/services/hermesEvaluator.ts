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
- **Nível:** Junior / Entry Level / Trainee.
- **Stack Principal:** Node.js, TypeScript, PHP (Laravel / CodeIgniter), NestJS, Express, React, Next.js, JavaScript, Tailwind CSS, Bootstrap, MySQL, PostgreSQL, Supabase, Docker, REST APIs.

**REGRAS DE LOCALIZAÇÃO E MODELO DE TRABALHO (ESTRITO):**
1. **APROVAR**: Qualquer vaga **REMOTA** (Remoto Brasil, Portugal ou Global).
2. **APROVAR**: Vaga **PRESENCIAL** ou **HÍBRIDA** nas cidades de **Palhoça** ou **São José** (SC).
3. **APROVAR**: Vaga **HÍBRIDA** em **Florianópolis** (ou Floripa).
4. **REJEITAR**: Vaga **PRESENCIAL** em **Florianópolis**.
5. **REJEITAR**: Vaga **PRESENCIAL** ou **HÍBRIDA** em qualquer outra cidade fora de Palhoça, São José ou Florianópolis (ex: São Paulo, Rio de Janeiro, Curitiba, etc.).

**REGRAS DE SENIORIDADE E STACK:**
- **REJEITAR** vagas de nível Pleno, Sênior, Sr, Lead, Tech Lead, Staff ou Arqueto.
- **DEDUZIR PONTOS / REJEITAR** vagas focadas exclusivamente em stacks distantes do perfil (ex: Java puro, C#/.NET, Ruby, Swift, Kotlin), a menos que seja vaga Full Stack Jr aberta a aprendizado.

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

    // 1. FILTRO DE LOCALIZAÇÃO E MODELO DE TRABALHO
    const isRemote = location.includes('remoto') || location.includes('remote') || text.includes('100% remoto') || text.includes('trabalho remoto') || text.includes('home office');
    const isHybrid = location.includes('híbrido') || location.includes('hibrido') || text.includes('híbrido') || text.includes('hibrido');
    const isPalhoca = location.includes('palhoça') || location.includes('palhoca');
    const isSaoJose = location.includes('são josé') || location.includes('sao jose');
    const isFlorianopolis = location.includes('florianópolis') || location.includes('florianopolis') || location.includes('floripa');

    let isLocationAccepted = false;
    let locationReason = '';

    if (isRemote) {
      isLocationAccepted = true;
      locationReason = 'Modelo Remoto';
    } else if (isPalhoca || isSaoJose) {
      isLocationAccepted = true;
      locationReason = `Presencial/Híbrido em ${isPalhoca ? 'Palhoça' : 'São José'}`;
    } else if (isFlorianopolis) {
      if (isHybrid) {
        isLocationAccepted = true;
        locationReason = 'Híbrido em Florianópolis';
      } else {
        return {
          isJuniorFullStack: false,
          score: 0,
          reasoning: 'Rejeitada via Heurística: Vaga presencial em Florianópolis não aceita.',
        };
      }
    } else {
      // Outras cidades presenciais/híbridas (fora de Palhoça/São José/Florianópolis)
      return {
        isJuniorFullStack: false,
        score: 0,
        reasoning: `Rejeitada via Heurística: Vaga presencial/híbrida fora de Palhoça/São José/Florianópolis (${job.location || 'Local externo'}).`,
      };
    }

    // 2. FILTRO DE SENIORIDADE
    const seniorKeywords = ['pleno', 'sênior', 'senior', 'sr.', 'sr ', 'lead', 'lider', 'líder', 'architect', 'arqueto', 'staff', 'principal'];
    const juniorKeywords = ['junior', 'júnior', 'jr', 'entry level', 'iniciante', 'trainee', 'associado', 'associate'];

    const hasSenior = seniorKeywords.some((kw) => text.includes(kw));
    const hasJunior = juniorKeywords.some((kw) => text.includes(kw));

    if (hasSenior && !hasJunior) {
      return {
        isJuniorFullStack: false,
        score: 10,
        reasoning: 'Rejeitada via Heurística: Identificados termos de nível Pleno/Sênior/Lead no título ou descrição.',
      };
    }

    // 3. MATCH DE STACK DO MOACIR NETO
    const targetStack = [
      'node', 'nodejs', 'typescript', 'php', 'laravel', 'codeigniter',
      'nestjs', 'express', 'react', 'next', 'nextjs', 'javascript',
      'tailwind', 'bootstrap', 'mysql', 'postgres', 'postgresql', 'supabase', 'docker', 'rest'
    ];

    const unalignedStack = ['java', 'c#', '.net', 'csharp', 'ruby', 'swift', 'kotlin'];

    const matchedStackCount = targetStack.filter((tech) => text.includes(tech)).length;
    const hasUnalignedOnly = unalignedStack.some((tech) => text.includes(tech)) && matchedStackCount === 0;

    if (hasUnalignedOnly) {
      return {
        isJuniorFullStack: false,
        score: 20,
        reasoning: 'Rejeitada via Heurística: Stack focada em tecnologias fora do perfil prioritário (Java/C#/Mobile/etc).',
      };
    }

    const fullstackKeywords = ['full stack', 'fullstack', 'full-stack', 'frontend e backend', 'front e back', 'desenvolvedor web'];
    const hasFullStack = fullstackKeywords.some((kw) => text.includes(kw));

    let score = (hasJunior ? 40 : 25) + (hasFullStack ? 35 : 20) + Math.min(matchedStackCount * 5, 25);

    return {
      isJuniorFullStack: score >= 60 && isLocationAccepted,
      score,
      reasoning: `Aprovada via Heurística (${locationReason}): ${hasJunior ? 'Nível Jr. ' : ''}${hasFullStack ? 'Full Stack. ' : ''}${matchedStackCount} tecnologias compatíveis com o CV.`,
    };
  }
}
