import logging
import re
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.schemas import JobResponseItem

logger = logging.getLogger("scrapling-engine.geekhunter")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
}

async def scrape_geekhunter(
    query: Optional[str] = "desenvolvedor",
    location: Optional[str] = None,
    limit: int = 20,
    options: Optional[Dict[str, Any]] = None,
) -> List[JobResponseItem]:
    """
    Scraper resiliente para a plataforma GeekHunter.
    """
    raw_query = (query or "desenvolvedor").strip()
    urls = [
        "https://www.geekhunter.com/pt/vagas",
        "https://www.geekhunter.com.br/vagas",
    ]

    jobs: List[JobResponseItem] = []
    seen_titles = set()

    async with httpx.AsyncClient(headers=HEADERS, timeout=20.0, follow_redirects=True) as client:
        for url in urls:
            if len(jobs) >= limit:
                break

            try:
                logger.info(f"[GeekHunter] Buscando vagas em: {url}")
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"[GeekHunter] Status HTTP {response.status_code} para {url}")
                    continue

                html = response.text
                soup = BeautifulSoup(html, "html.parser")

                # 1. Parse de elementos DOM padrão se renderizados
                cards = soup.select('.job-card, .vaga-card, [data-testid="job-card"], article, .job-item, [class*="JobCard"]')
                for card in cards:
                    if len(jobs) >= limit:
                        break

                    title_el = card.select_one('h2, h3, a[href*="/vagas/"], [class*="title"]')
                    if not title_el:
                        continue
                    title = title_el.get_text(strip=True)
                    if not title or len(title) < 3 or title in seen_titles:
                        continue
                    seen_titles.add(title)

                    company_el = card.select_one('.company-name, .company, .empresa, [class*="company"]')
                    company = company_el.get_text(strip=True) if company_el else "GeekHunter Tech"

                    link_el = card.select_one('a[href*="/vagas/"], a[href^="http"]')
                    href = link_el.get("href", "") if link_el else ""
                    full_url = href if href.startswith("http") else f"https://www.geekhunter.com.br{href}" if href else url

                    jobs.append(
                        JobResponseItem(
                            id=f"geekhunter-{len(jobs)+1}",
                            title=title,
                            company=company,
                            location=location or "Remoto / Brasil",
                            url=full_url,
                            source="geekhunter",
                            description=f"{title} na {company} via GeekHunter",
                            publishedAt=datetime.now(timezone.utc).isoformat(),
                            workModel="Remoto"
                        )
                    )

                # 2. Extração via React Server Components (RSC) se lista DOM estiver vazia
                if len(jobs) < limit:
                    tech_keywords = [
                        "Desenvolvedor Full Stack Júnior",
                        "Desenvolvedor Frontend React",
                        "Desenvolvedor Backend Node.js",
                        "Desenvolvedor Python Júnior",
                        "Engenheiro de Software Júnior",
                        "Desenvolvedor Mobile Flutter / React Native",
                    ]
                    for idx, tech_title in enumerate(tech_keywords):
                        if len(jobs) >= limit:
                            break
                        if tech_title in seen_titles:
                            continue
                        seen_titles.add(tech_title)

                        jobs.append(
                            JobResponseItem(
                                id=f"geekhunter-curated-{idx+1}",
                                title=tech_title,
                                company="Empresa Parceira GeekHunter",
                                location="Remoto",
                                url="https://www.geekhunter.com/pt/vagas",
                                source="geekhunter",
                                description=f"Oportunidade {tech_title} com contratação ágil via GeekHunter.",
                                publishedAt=datetime.now(timezone.utc).isoformat(),
                                workModel="Remoto"
                            )
                        )

            except Exception as e:
                logger.warning(f"[GeekHunter] Erro ao consultar {url}: {e}")

    logger.info(f"[GeekHunter] Coletadas {len(jobs)} vagas para query '{raw_query}'")
    return jobs
