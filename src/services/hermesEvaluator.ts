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
Você é um recrutador técnico especialista. Avalie a seguinte vaga para determinar se ela atende estritamente ao perfil "Desenvolvedor Full Stack Júnior" ou "Desenvolvedor Júnior".

**Regras de Rejeição (isJuniorFullStack = false, score < 50):**
- Vagas de nível Pleno, Sênior, Sr, Specialist, Tech Lead ou Arqueto.
- Vagas que exijam mais de 3 anos de experiência comprovada.
- Vagas exclusivas de Estágio ou Trainee que não contratem efetivo Jr (a menos que seja vaga Jr inicial).

**Regras de Aprovação (isJuniorFullStack = true, score >= 70):**
- Vagas explicitamente marcadas como "Junior", "Jr", "Iniciante", "Entry level" ou sem nível mas com requisitos básicos.
- Vagas com escopo Full Stack (Frontend + Backend) ou com abertura para aprendizado em ambos.

**Vaga a ser analisada:**
- Título: ${job.title}
- Empresa: ${job.company}
- Descrição: ${job.description}

Responda APENAS em formato JSON no seguinte modelo:
{
  "isJuniorFullStack": boolean,
  "score": number,
  "reasoning": "Breve justificativa explicativa em português (máx 2 frases)"
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

    // Palavras-chave de localização internacional a rejeitar (exceto Brasil e Portugal)
    const intlLocations = [
      'united states', 'usa', 'u.s.', 'canada', 'uk', 'united kingdom', 'england',
      'germany', 'alemanha', 'berlin', 'spain',
      'espanha', 'madrid', 'barcelona', 'france', 'frança', 'paris', 'utah', 'california',
      'texas', 'florida', 'new york', 'maryland', 'virginia', 'carolina', 'colorado',
      'kansas', 'massachusetts', 'indiana', 'distrito de colúmbia', 'dc',
    ];

    const isIntlLocation = intlLocations.some((loc) => location.includes(loc) || job.title.toLowerCase().includes(loc));

    if (isIntlLocation) {
      return {
        isJuniorFullStack: false,
        score: 0,
        reasoning: 'Rejeitada via Heurística: Vaga internacional fora do escopo (Brasil / Portugal / Remoto BR/PT).',
      };
    }

    const seniorKeywords = ['pleno', 'sênior', 'senior', 'sr.', 'sr ', 'lead', 'lider', 'líder', 'architect', 'arqueto', 'staff', 'principal'];
    const juniorKeywords = ['junior', 'júnior', 'jr', 'entry level', 'iniciante', 'trainee', 'associado', 'associate'];
    const fullstackKeywords = ['full stack', 'fullstack', 'full-stack', 'frontend e backend', 'front e back'];

    const hasSenior = seniorKeywords.some((kw) => text.includes(kw));
    const hasJunior = juniorKeywords.some((kw) => text.includes(kw));
    const hasFullStack = fullstackKeywords.some((kw) => text.includes(kw));

    if (hasSenior && !hasJunior) {
      return {
        isJuniorFullStack: false,
        score: 10,
        reasoning: 'Rejeitada via Heurística: Identificados termos de nível Pleno/Sênior/Lead no título ou descrição.',
      };
    }

    if (hasJunior || hasFullStack) {
      const score = (hasJunior ? 50 : 30) + (hasFullStack ? 40 : 20);
      return {
        isJuniorFullStack: score >= 60,
        score,
        reasoning: `Aprovada via Heurística: ${hasJunior ? 'Termo Júnior identificado. ' : ''}${hasFullStack ? 'Escopo Full Stack identificado.' : ''}`,
      };
    }

    return {
      isJuniorFullStack: false,
      score: 40,
      reasoning: 'Rejeitada via Heurística: Nível ou escopo técnico indeterminado/incompatível.',
    };
  }
}
