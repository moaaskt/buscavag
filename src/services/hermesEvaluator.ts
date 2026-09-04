import { GoogleGenAI } from '@google/genai';
import { RawJob } from '../types/job.js';
import { matchesWhitelist } from '../config/jobFilters.js';

export interface EvaluationResult {
  isJuniorFullStack: boolean;
  overallScore: number;
  score?: number; // Mantido para retrocompatibilidade
  stackScore: number;
  seniorityScore: number;
  locationScore: number;
  category: string;
  gaps: string[];
  resumeTips: string;
  reasoning: string;
}

export class HermesEvaluator {
  private client: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.HERMES_API_KEY;

    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
      });
    }
  }

  public async evaluate(job: RawJob): Promise<EvaluationResult> {
    const matchThreshold = Number(process.env.MATCH_THRESHOLD) || 55;

    if (!this.client) {
      return this.evaluateHeuristic(job);
    }

    try {
      const prompt = `
Você é um recrutador técnico especialista avaliando vagas para o perfil de **Moacir Neto** (Dev Full Stack Junior & Especialista IoT / Automação Residencial).

**Perfil de Moacir Neto:**
- **Nível:** Junior / Entry Level / Trainee / Sem especificação de nível.
- **Stack Principal Web & Backend:** Node.js, TypeScript, PHP (Laravel / CodeIgniter), NestJS, Express, React, Next.js, JavaScript, Python, Golang, Tailwind CSS, Bootstrap, MySQL, PostgreSQL, Supabase, Docker, REST APIs.
- **Especialização em IoT, Hardware & Automação:** Microcontroladores ESP32, ESP8266, Arduino, Raspberry Pi, MQTT, Home Assistant, ESPHome, C/C++ para embarcados, sensores/atuadores, automação residencial e integração hardware-web via WebSockets e APIs.

**REGRAS DE LOCALIZAÇÃO E MODELO DE TRABALHO (ESTRITO E PRIORITÁRIO):**
1. **APROVAR REMOTO PRIMEIRO**: Se a vaga for **REMOTA** (contendo "remoto", "remote", "home office", "teletrabalho", "work from home", "anywhere" ou localização genérica "Brasil", "Brazil", "Portugal"), defina **locationScore = 100** independentemente da cidade indicada.
2. **SE NÃO FOR REMOTA (PRESENCIAL / HÍBRIDO):**
   - Presencial ou Híbrido em **Palhoça (SC)** ou **São José (SC)**: locationScore = 100. (Atenção: Rejeitar São José dos Campos/SP).
   - Híbrido em **Florianópolis (SC)** ou **Floripa**: locationScore = 100.
   - Presencial em **Florianópolis (SC)**: locationScore = 0 (REJEITAR).
   - Presencial ou Híbrido em qualquer outra cidade (ex: São Paulo, Curitiba, Belo Horizonte, etc.): locationScore = 0 (REJEITAR).

**REGRAS DE SENIORIDADE E ESCOPO:**
- Junior / Entry Level / Trainee / Sem nível especificado: seniorityScore entre 80 e 100.
- Pleno, Sênior, Sr, Lead, Tech Lead, Staff, Arquiteto: seniorityScore entre 0 e 20 (REJEITAR).

**REGRAS DE STACK E LACUNAS (GAPS):**
- stackScore (0 a 100): Avalie a aderência com a stack de Moacir (Web Full Stack e/ou IoT/ESP32/Automação).
- gaps: Liste apenas tecnologias essenciais da vaga que NÃO constam na stack de Moacir (ex: ["Kubernetes", "AWS", "Ruby", "Swift"]). Tecnologias de IoT, MQTT, ESP32, C++ básico NÃO são gaps, são pontos fortes. Se não houver lacunas relevantes, retorne [].
- resumeTips: Dica concisa de até 2 frases de como Moacir pode adaptar seu currículo ou carta para esta vaga específica (destacando projetos Web ou IoT conforme a vaga).

**CATEGORIZAÇÃO:**
- category: Classifique estritamente em uma das opções: "Frontend", "Backend", "Full Stack", "DevOps", "Data", "Mobile", "IoT & Automação" ou "Other".

**Vaga a ser analisada:**
- Título: ${job.title}
- Empresa: ${job.company}
- Localização indicada: ${job.location || 'Não informada'}
- Descrição: ${job.description}

Responda APENAS em formato JSON no seguinte modelo:
{
  "isJuniorFullStack": boolean,
  "overallScore": number,
  "stackScore": number,
  "seniorityScore": number,
  "locationScore": number,
  "category": "Frontend" | "Backend" | "Full Stack" | "DevOps" | "Data" | "Mobile" | "IoT & Automação" | "Other",
  "gaps": string[],
  "resumeTips": string,
  "reasoning": "Justificativa clara em português indicando adequação de localização, senioridade e stack (incluindo IoT/Automação se aplicável)"
}
`;

      const response = await this.client.models.generateContent({
        model: process.env.HERMES_MODEL || 'gemini-flash-latest',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

        const content = response.text;
      if (content) {
        const parsed = JSON.parse(content);
        let overallScore = Math.min(100, Math.max(0, Number(parsed.overallScore ?? parsed.score) || 0));
        const stackScore = Math.min(100, Math.max(0, Number(parsed.stackScore) || 0));
        const seniorityScore = Math.min(100, Math.max(0, Number(parsed.seniorityScore) || 0));
        const locationScore = Math.min(100, Math.max(0, Number(parsed.locationScore ?? 100)));
        let isApproved = Boolean(parsed.isJuniorFullStack) && overallScore >= matchThreshold && locationScore > 0;
        let reasoning = String(parsed.reasoning || 'Avaliação via Hermes AI');

        // Trava SCR-10: Se stackScore === 0 e nenhum termo tech no título, força score 0 e rejeição
        const titleHasTech = matchesWhitelist(job.title).matched;
        if (stackScore === 0 && !titleHasTech) {
          overallScore = 0;
          isApproved = false;
          reasoning = `Rejeitada (Trava não-tech): Stack score zerado e título sem palavra-chave de tecnologia.`;
        }

        return {
          isJuniorFullStack: isApproved,
          overallScore,
          score: overallScore,
          stackScore,
          seniorityScore,
          locationScore,
          category: String(parsed.category || 'Full Stack'),
          gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String) : [],
          resumeTips: String(parsed.resumeTips || ''),
          reasoning,
        };
      }
    } catch (err) {
      console.warn(`[HermesEvaluator] Erro na API do Hermes/OpenAI para vaga "${job.title}". Usando fallback de heurística:`, (err as Error).message);
    }

    return this.evaluateHeuristic(job);
  }

  public evaluateHeuristic(job: RawJob): EvaluationResult {
    const matchThreshold = Number(process.env.MATCH_THRESHOLD) || 55;
    const text = `${job.title} ${job.description}`.toLowerCase();
    const location = (job.location || '').toLowerCase();
    const titleLower = job.title.toLowerCase();

    // 1. DETECÇÃO PRIORITÁRIA DE TRABALHO REMOTO
    const remoteKeywords = ['remoto', 'remote', 'home office', 'teletrabalho', 'work from home', 'anywhere'];
    const isGenericCountry = location === 'brasil' || location === 'brazil' || location === 'portugal' || location === 'remoto';
    const isRemote = remoteKeywords.some((kw) => location.includes(kw) || titleLower.includes(kw) || text.includes(kw)) || isGenericCountry;

    let isLocationAccepted = false;
    let locationScore = 0;
    let locationReason = '';

    if (isRemote) {
      isLocationAccepted = true;
      locationScore = 100;
      locationReason = 'Modelo Remoto';
    } else {
      // 2. REGRA PARA PRESENCIAL / HÍBRIDO
      const isHybrid = location.includes('híbrido') || location.includes('hibrido') || text.includes('híbrido') || text.includes('hibrido');
      const isSaoJoseCampos = location.includes('dos campos') || location.includes('sjc') || location.includes('sp');
      const isSaoJose = (location.includes('são josé') || location.includes('sao jose')) && !isSaoJoseCampos;
      const isPalhoca = location.includes('palhoça') || location.includes('palhoca');
      const isFlorianopolis = location.includes('florianópolis') || location.includes('florianopolis') || location.includes('floripa');

      if (isPalhoca || isSaoJose) {
        isLocationAccepted = true;
        locationScore = 100;
        locationReason = `Presencial/Híbrido em ${isPalhoca ? 'Palhoça (SC)' : 'São José (SC)'}`;
      } else if (isFlorianopolis) {
        if (isHybrid) {
          isLocationAccepted = true;
          locationScore = 100;
          locationReason = 'Híbrido em Florianópolis (SC)';
        } else {
          isLocationAccepted = false;
          locationScore = 0;
          locationReason = 'Presencial em Florianópolis não aceito';
        }
      } else {
        isLocationAccepted = false;
        locationScore = 0;
        locationReason = `Presencial/híbrido fora de Palhoça/São José(SC)/Florianópolis (${job.location || 'Externo'})`;
      }
    }

    // 3. FILTRO DE SENIORIDADE
    const seniorKeywords = ['pleno', 'sênior', 'senior', 'sr.', 'sr ', 'lead', 'lider', 'líder', 'architect', 'arquiteto', 'staff', 'principal'];
    const juniorKeywords = ['junior', 'júnior', 'jr', 'entry level', 'iniciante', 'trainee', 'associado', 'associate', 'estágio', 'estagio'];

    const hasSenior = seniorKeywords.some((kw) => text.includes(kw));
    const hasJunior = juniorKeywords.some((kw) => text.includes(kw));

    let seniorityScore = 70;
    if (hasSenior && !hasJunior) {
      seniorityScore = 10;
    } else if (hasJunior) {
      seniorityScore = 100;
    }

    // 4. STACK DO MOACIR NETO (WEB FULL STACK + IOT / HARDWARE / AUTOMAÇÃO)
    const targetStack = [
      // Web / Backend / Frontend
      'node', 'nodejs', 'typescript', 'php', 'laravel', 'codeigniter',
      'nestjs', 'express', 'react', 'next', 'nextjs', 'javascript', 'js', 'ts',
      'python', 'golang', 'go', 'tailwind', 'bootstrap', 'mysql', 'postgres', 'postgresql', 'supabase', 'docker', 'rest', 'sql',
      // IoT / Embarcados / Automação
      'esp32', 'esp8266', 'arduino', 'raspberry', 'iot', 'mqtt', 'home assistant', 'esphome', 'automacao', 'automação', 'embarcados', 'firmware', 'c++', 'c/c++'
    ];
    const rejectedStack = ['cobol', 'swift', 'objective-c'];

    const matchedStackList = targetStack.filter((tech) => text.includes(tech));
    const matchedStackCount = matchedStackList.length;
    const hasRejectedOnly = rejectedStack.some((tech) => text.includes(tech)) && matchedStackCount === 0;

    let stackScore = Math.min(100, Math.round(matchedStackCount * 18));
    if (hasRejectedOnly) {
      stackScore = 10;
    }

    // 5. CATEGORIZAÇÃO
    let category = 'Full Stack';
    const isIotMatch = text.includes('esp32') || text.includes('esp8266') || text.includes('arduino') || text.includes('raspberry') || text.includes('iot') || text.includes('mqtt') || text.includes('home assistant') || text.includes('embarcados') || text.includes('automação') || text.includes('automacao');

    if (isIotMatch) {
      category = 'IoT & Automação';
    } else if (text.includes('react native') || text.includes('flutter') || text.includes('mobile') || text.includes('android') || text.includes('ios')) {
      category = 'Mobile';
    } else if (text.includes('devops') || text.includes('sre') || text.includes('cloud') || text.includes('kubernetes') || text.includes('infra')) {
      category = 'DevOps';
    } else if (text.includes('dados') || text.includes('data engineer') || text.includes('data science') || text.includes('analytics')) {
      category = 'Data';
    } else if (
      (text.includes('frontend') || text.includes('front-end') || text.includes('front end')) &&
      !text.includes('backend') && !text.includes('back-end')
    ) {
      category = 'Frontend';
    } else if (
      (text.includes('backend') || text.includes('back-end') || text.includes('back end')) &&
      !text.includes('frontend') && !text.includes('front-end')
    ) {
      category = 'Backend';
    }

    // 6. DETECÇÃO DE GAPS
    const potentialGaps = [
      'aws', 'gcp', 'azure', 'kubernetes', 'graphql', 'c#', '.net', 'ruby', 'rails', 'java',
      'spring', 'angular', 'vue', 'mongodb', 'redis', 'kafka', 'rabbitmq', 'elixir'
    ];
    const gaps = potentialGaps.filter((tech) => {
      const regex = new RegExp(`\\b${tech.replace('+', '\\+')}\\b`, 'i');
      return regex.test(text);
    });

    // 7. DICAS DE CURRÍCULO
    const topTechs = matchedStackList.slice(0, 3).map((t) => t.toUpperCase()).join(', ');
    let resumeTips = '';
    if (category === 'IoT & Automação') {
      resumeTips = 'Destaque seus projetos práticos com microcontroladores (ESP32/Arduino), integrações MQTT e automação com Home Assistant.';
    } else if (topTechs) {
      resumeTips = `Destaque no topo do currículo sua experiência com ${topTechs} e mencione projetos práticos desenvolvidos com essas tecnologias.`;
    } else {
      resumeTips = 'Destaque seus projetos full stack e capacidade de rápida adaptação técnica.';
    }

    // 8. OVERALL SCORE PONDERADO
    let overallScore = Math.round(
      (stackScore * 0.45) +
      (seniorityScore * 0.35) +
      (locationScore * 0.20)
    );
    if (!isLocationAccepted) {
      overallScore = Math.min(overallScore, 40);
    }
    overallScore = Math.min(100, Math.max(0, overallScore));

    let isJuniorFullStack = overallScore >= matchThreshold && isLocationAccepted && seniorityScore >= 40;

    let reasoning = '';
    const titleHasTech = matchesWhitelist(job.title).matched;
    if (stackScore === 0 && !titleHasTech) {
      overallScore = 0;
      isJuniorFullStack = false;
      reasoning = 'Rejeitada via Heurística (Trava não-tech): Stack score zerado e título sem palavra-chave de tecnologia.';
    } else if (!isLocationAccepted) {
      reasoning = `Rejeitada via Heurística: ${locationReason}.`;
    } else if (hasSenior && !hasJunior) {
      reasoning = 'Rejeitada via Heurística: Vaga com exigência de nível Pleno/Sênior/Lead.';
    } else {
      const specNote = category === 'IoT & Automação' ? 'Especialização em IoT/Automação detectada. ' : '';
      reasoning = `Aprovada via Heurística (${locationReason}): ${specNote}${hasJunior ? 'Nível Jr/Entry. ' : ''}${matchedStackCount} tecnologias compatíveis (${topTechs || 'Gerais'}).`;
    }

    return {
      isJuniorFullStack,
      overallScore,
      score: overallScore,
      stackScore,
      seniorityScore,
      locationScore,
      category,
      gaps,
      resumeTips,
      reasoning,
    };
  }
}
