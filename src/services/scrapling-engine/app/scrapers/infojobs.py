import logging
import re
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.schemas import JobResponseItem

logger = logging.getLogger("scrapling-engine.infojobs")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

def parse_infojobs_date(date_str: str) -> str:
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    cleaned = date_str.lower().strip()
    now = datetime.now(timezone.utc)
    if "hoje" in cleaned or "agora" in cleaned:
        return now.isoformat()
    if "ontem" in cleaned:
        return (now - timedelta(days=1)).isoformat()
    days_match = re.search(r"h[aá]\s*(\d+)\s*dia", cleaned)
    if days_match:
        return (now - timedelta(days=int(days_match.group(1)))).isoformat()
    date_match = re.search(r"(\d{1,2})[/.-](\d{1,2})", cleaned)
    if date_match:
        try:
            day = int(date_match.group(1))
            month = int(date_match.group(2))
            return datetime(now.year, month, day, tzinfo=timezone.utc).isoformat()
        except Exception:
            pass
    return now.isoformat()

async def scrape_infojobs(
    query: Optional[str] = "desenvolvedor",
    location: Optional[str] = None,
    limit: int = 20,
    options: Optional[Dict[str, Any]] = None,
) -> List[JobResponseItem]:
    """
    Scraper otimizado para o portal InfoJobs Brasil.
    """
    raw_query = (query or "desenvolvedor").strip()
    slug_query = re.sub(r"[^a-zA-Z0-9]+", "-", raw_query.lower()).strip("-")
    
    urls = [
        f"https://www.infojobs.com.br/vagas-de-emprego-{slug_query}.aspx",
        "https://www.infojobs.com.br/vagas-de-emprego-desenvolvedor-junior.aspx",
        "https://www.infojobs.com.br/vagas-de-emprego-desenvolvedor.aspx",
    ]

    jobs: List[JobResponseItem] = []
    seen_urls = set()

    async with httpx.AsyncClient(headers=HEADERS, timeout=20.0, follow_redirects=True) as client:
        for url in urls:
            if len(jobs) >= limit:
                break

            try:
                logger.info(f"[InfoJobs] Buscando em: {url}")
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"[InfoJobs] Status HTTP {response.status_code} para {url}")
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                cards = soup.select('.js_card_link, .card-job, [class*="cardJob"], div[data-id]')

                for card in cards:
                    if len(jobs) >= limit:
                        break

                    title_el = card.select_one('h2, h3, .js_linkVacancy, a[href*="/vaga-de-"], [class*="title"]')
                    if not title_el:
                        continue
                    title = title_el.get_text(strip=True)
                    if not title or len(title) < 3:
                        continue

                    link_el = card.select_one('a[href*="/vaga-de-"], a.js_linkVacancy')
                    href = link_el.get("href", "") if link_el else ""
                    if not href:
                        continue

                    full_url = href if href.startswith("http") else f"https://www.infojobs.com.br{href}"
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    # Extrair textos estruturados
                    text_parts = [t.strip() for t in card.stripped_strings]
                    
                    company = "InfoJobs Partner"
                    loc = location or "Brasil"
                    salary = None
                    work_model = "Presencial"
                    date_str = ""
                    desc = f"{title} no InfoJobs"

                    for part in text_parts:
                        p_lower = part.lower()
                        if "empresa" in p_lower or "ltda" in p_lower or "s.a." in p_lower:
                            company = part
                        elif any(uf in part for uf in [" - SP", " - RJ", " - SC", " - PR", " - MG", " - RS", " - BA"]):
                            loc = part
                        elif "r$" in part.lower() or "a combinar" in part.lower():
                            salary = part
                        elif "remoto" in p_lower:
                            work_model = "Remoto"
                        elif "híbrido" in p_lower or "hibrido" in p_lower:
                            work_model = "Híbrido"
                        elif "hoje" in p_lower or "ontem" in p_lower or "dias" in p_lower:
                            date_str = part
                        elif len(part) > 40 and not desc.startswith("Principais"):
                            desc = part

                    pub_date = parse_infojobs_date(date_str)

                    jobs.append(
                        JobResponseItem(
                            id=f"infojobs-{len(jobs)+1}",
                            title=title,
                            company=company,
                            location=loc,
                            url=full_url,
                            source="infojobs",
                            description=desc,
                            publishedAt=pub_date,
                            salary=salary,
                            workModel=work_model
                        )
                    )

            except Exception as err:
                logger.warning(f"[InfoJobs] Erro na requisição para {url}: {err}")

    logger.info(f"[InfoJobs] Coletadas {len(jobs)} vagas para query '{raw_query}'")
    return jobs
