import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx

logger = logging.getLogger("scrapling-engine.cv_analyzer")

# Lista base de tecnologias conhecidas para extração heurística e enriquecimento
TECH_KEYWORDS = [
    "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "NestJS", "Express",
    "Python", "FastAPI", "Django", "Flask", "PHP", "Laravel", "Golang", "Java", "Spring Boot",
    "C#", ".NET", "C++", "C", "Rust", "Ruby", "Rails",
    "HTML", "HTML5", "CSS", "CSS3", "Tailwind CSS", "Bootstrap", "Sass", "Styled Components",
    "Vue.js", "Angular", "Svelte", "Redux", "Zustand", "GraphQL", "REST APIs", "gRPC", "WebSockets",
    "PostgreSQL", "MySQL", "MongoDB", "SQLite", "Redis", "Supabase", "Firebase", "Prisma", "TypeORM",
    "Docker", "Kubernetes", "AWS", "Google Cloud", "GCP", "Azure", "CI/CD", "GitHub Actions", "Git", "Linux",
    "Microserviços", "Clean Architecture", "TDD", "Jest", "Cypress", "Playwright",
    "IoT", "ESP32", "ESP8266", "Arduino", "Raspberry Pi", "MQTT", "Home Assistant", "Automação", "Robótica",
    "Machine Learning", "IA", "LLM", "Pandas", "NumPy", "Scikit-Learn", "PyTorch", "TensorFlow"
]

SOFT_SKILLS_KEYWORDS = [
    "Comunicação assertiva", "Trabalho em equipe", "Resolução de problemas", "Pensamento crítico",
    "Autonomia", "Gestão de tempo", "Adaptabilidade", "Proatividade", "Liderança", "Metodologias Ágeis (Scrum/Kanban)"
]


def heuristic_cv_analysis(cv_text: str) -> Dict[str, Any]:
    """
    Análise heurística semântica baseada em regras para extração de dados do currículo.
    Executada com alta velocidade e utilizada também como fallback resiliente.
    """
    lower_text = cv_text.lower()

    # 1. Identificar Hard Skills presentes no texto
    detected_hard_skills: List[str] = []
    for tech in TECH_KEYWORDS:
        # Regex com limite de palavra
        pattern = r"(?<!\w)" + re.escape(tech.lower()) + r"(?!\w)"
        if re.search(pattern, lower_text):
            detected_hard_skills.append(tech)

    # 2. Identificar Soft Skills
    detected_soft_skills: List[str] = []
    for soft in SOFT_SKILLS_KEYWORDS:
        if soft.lower() in lower_text or any(w.lower() in lower_text for w in soft.split()):
            if soft not in detected_soft_skills:
                detected_soft_skills.append(soft)

    if not detected_soft_skills:
        detected_soft_skills = ["Trabalho em equipe", "Resolução de problemas", "Proatividade", "Autonomia"]

    # 3. Estimar Senioridade
    seniority = "Júnior"
    if re.search(r"(estagi[áa]rio|est[áa]gio|trainee|iniciante)", lower_text):
        seniority = "Estágio"
    elif re.search(r"(especialista|tech lead|l[íi]der t[ée]cnico|principal|staff|arquiteto)", lower_text):
        seniority = "Especialista / Tech Lead"
    elif re.search(r"(s[êe]nior|sr\.|senior|\b5\+?\s*anos|\b6\+?\s*anos|\b7\+?\s*anos|\b8\+?\s*anos)", lower_text):
        seniority = "Sênior"
    elif re.search(r"(pleno|pl\.|mid-level|\b3\s*anos|\b4\s*anos)", lower_text):
        seniority = "Pleno"
    elif re.search(r"(j[úu]nior|jr\.|junior|\b1\s*ano|\b2\s*anos)", lower_text):
        seniority = "Júnior"

    # 4. Estimar Cargo Principal
    detected_role = "Desenvolvedor de Software"
    if re.search(r"(full\s*stack|fullstack)", lower_text):
        detected_role = "Desenvolvedor Full Stack"
    elif re.search(r"(frontend|front-end|front end)", lower_text):
        detected_role = "Desenvolvedor Frontend"
    elif re.search(r"(backend|back-end|back end)", lower_text):
        detected_role = "Desenvolvedor Backend"
    elif re.search(r"(iot|hardware|embarcados|automa[çc][ãa]o)", lower_text):
        detected_role = "Desenvolvedor IoT & Automação"
    elif re.search(r"(mobile|android|ios|react native|flutter)", lower_text):
        detected_role = "Desenvolvedor Mobile"
    elif re.search(r"(dados|data engineer|data scientist|machine learning)", lower_text):
        detected_role = "Engenheiro de Dados & IA"

    # 5. Gerar Resumo Executivo
    tech_highlight = ", ".join(detected_hard_skills[:6]) if detected_hard_skills else "tecnologias modernas"
    summary = (
        f"Profissional com foco em {detected_role} ({seniority}), com competências consolidadas em {tech_highlight}. "
        f"Perfil voltado para desenvolvimento ágil, entrega de código limpo e resolução de problemas técnicos complexos."
    )

    # 6. Pontos Fortes
    strengths = []
    if len(detected_hard_skills) >= 5:
        strengths.append(f"Stack técnica diversificada com {len(detected_hard_skills)} ferramentas e linguagens identificadas.")
    if "TypeScript" in detected_hard_skills or "React" in detected_hard_skills or "Next.js" in detected_hard_skills:
        strengths.append("Domínio em ecossistemas modernos de alta demanda no mercado (React, TypeScript e Next.js).")
    if "ESP32" in detected_hard_skills or "Arduino" in detected_hard_skills or "IoT" in detected_hard_skills:
        strengths.append("Diferencial competitivo sólido em IoT, Hardware e automação de sistemas.")
    if "Docker" in detected_hard_skills or "PostgreSQL" in detected_hard_skills:
        strengths.append("Boas práticas de infraestrutura, bancos de dados relacionais e containerização.")
    if not strengths:
        strengths.append("Perfil focado em evolução contínua e adoção de novas tecnologias.")

    # 7. Dicas de Melhoria ATS (Applicant Tracking Systems)
    improvement_tips = [
        "Quantifique conquistas nos tópicos de experiência (ex: 'Redução de 30% no tempo de carregamento', 'Desenvolvimento de 10+ endpoints').",
        "Inclua links diretos e clicáveis para repositórios no GitHub e aplicações em produção no topo do currículo.",
        "Mantenha uma seção destacada de 'Habilidades Técnicas' organizada por categorias (Frontend, Backend, Bancos, Ferramentas) para facilitar a leitura por robôs ATS."
    ]

    return {
        "detected_role": detected_role,
        "detected_seniority": seniority,
        "hard_skills": detected_hard_skills,
        "soft_skills": detected_soft_skills,
        "summary": summary,
        "strengths": strengths,
        "improvement_tips": improvement_tips,
        "source": "heuristic-engine",
    }


async def analyze_cv_with_gemini(cv_text: str, api_key: str) -> Optional[Dict[str, Any]]:
    """
    Envia o texto do currículo para o modelo Gemini via API REST assíncrona
    retornando JSON estritamente estruturado.
    """
    prompt = f"""
Você é um recrutador técnico sênior e especialista em análise de currículos de tecnologia e sistemas ATS.
Analise o currículo a seguir e forneça uma estruturação JSON rigorosa.

Currículo do Candidato:
\"\"\"
{cv_text[:8000]}
\"\"\"

Instruções de Saída:
Retorne APENAS um objeto JSON válido no seguinte formato exato (sem formatação markdown extra fora do json):
{{
  "detected_role": "Cargo principal inferido (ex: Desenvolvedor Full Stack, Dev Frontend, Engenheiro de Software)",
  "detected_seniority": "Estágio" ou "Júnior" ou "Pleno" ou "Sênior" ou "Especialista / Tech Lead",
  "hard_skills": ["lista", "de", "hard", "skills", "tecnologias", "linguagens", "frameworks"],
  "soft_skills": ["lista", "de", "soft", "skills"],
  "summary": "Resumo executivo conciso e profissional em 2 a 4 frases do perfil do candidato",
  "strengths": ["Ponto forte 1", "Ponto forte 2", "Ponto forte 3"],
  "improvement_tips": ["Dica 1 para melhorar o currículo para vagas e ATS", "Dica 2", "Dica 3"]
}}
"""

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt}
                ]
            }
        ],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2,
        }
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            res = await client.post(url, json=payload)
            if res.status_code == 200:
                data = res.json()
                candidate_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(candidate_content)
                parsed["source"] = "gemini-2.5-flash"
                return parsed
            else:
                # Tenta fallback para gemini-1.5-flash se 2.5 não responder
                fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
                res_fallback = await client.post(fallback_url, json=payload)
                if res_fallback.status_code == 200:
                    data = res_fallback.json()
                    candidate_content = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(candidate_content)
                    parsed["source"] = "gemini-1.5-flash"
                    return parsed
                else:
                    logger.warning(f"Gemini API returned status {res.status_code}: {res.text}")
                    return None
        except Exception as e:
            logger.error(f"Erro ao chamar API do Gemini para análise de CV: {e}")
            return None


async def analyze_cv_document(cv_text: str) -> Dict[str, Any]:
    """
    Orquestrador principal de análise de currículo:
    Tenta executar via Gemini AI; caso indisponível ou falhe, executa o motor heurístico semântico.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("HERMES_API_KEY")

    if api_key and cv_text.strip():
        ai_result = await analyze_cv_with_gemini(cv_text, api_key)
        if ai_result:
            return ai_result

    # Fallback automático
    return heuristic_cv_analysis(cv_text)
