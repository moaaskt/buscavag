import logging
import re
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx
from bs4 import BeautifulSoup

from app.schemas import JobResponseItem

logger = logging.getLogger("scrapling-engine.trabalha_brasil")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

async def scrape_trabalha_brasil(
    query: Optional[str] = "desenvolvedor",
    location: Optional[str] = None,
    limit: int = 20,
    options: Optional[Dict[str, Any]] = None,
) -> List[JobResponseItem]:
    """
    Scraper resiliente para a rede Trabalha Brasil / BNE (Banco Nacional de Empregos).
    """
    raw_query = (query or "desenvolvedor").strip()
    slug_query = re.sub(r"[^a-zA-Z0-9]+", "-", raw_query.lower()).strip("-")

    urls = [
        f"https://www.bne.com.br/vagas-de-emprego/{slug_query}",
        "https://www.bne.com.br/vagas-de-emprego/desenvolvedor-junior",
        "https://www.bne.com.br/vagas-de-emprego/desenvolvedor",
        f"https://www.trabalhabrasil.com.br/vagas-de-emprego/{slug_query}",
    ]

    jobs: List[JobResponseItem] = []
    seen_urls = set()

    async with httpx.AsyncClient(headers=HEADERS, timeout=20.0, follow_redirects=True) as client:
        for url in urls:
            if len(jobs) >= limit:
                break

            try:
                logger.info(f"[TrabalhaBrasil] Buscando em: {url}")
                response = await client.get(url)
                if response.status_code != 200:
                    logger.warning(f"[TrabalhaBrasil] Status HTTP {response.status_code} para {url}")
                    continue

                soup = BeautifulSoup(response.text, "html.parser")
                
                # Links para vagas no BNE / Trabalha Brasil
                vaga_links = [a for a in soup.find_all("a") if a.get("href") and ("/vaga-de-emprego-" in a.get("href") or "/vaga-" in a.get("href"))]

                for a_tag in vaga_links:
                    if len(jobs) >= limit:
                        break

                    href = a_tag.get("href", "")
                    if not href or "whatsapp" in href or "facebook" in href or "twitter" in href or "linkedin" in href:
                        continue

                    full_url = href if href.startswith("http") else f"https://www.bne.com.br{href}"
                    if full_url in seen_urls:
                        continue
                    seen_urls.add(full_url)

                    title_text = a_tag.get_text(strip=True)
                    if not title_text or len(title_text) < 3:
                        # Extrair do path da URL
                        slug_part = href.split("/")[-2] if "/" in href else href
                        title_text = slug_part.replace("-", " ").title()

                    # Inferir localização do slug da URL (ex: em-curitiba-pr)
                    loc_match = re.search(r"em-([a-zA-Z\-]+)-(pr|sc|sp|rj|mg|rs|ba|df|pe|ce)", href, re.IGNORECASE)
                    loc = loc_match.group(0).replace("em-", "").replace("-", " ").title() if loc_match else (location or "Brasil")

                    is_remote = "remoto" in (title_text + " " + loc).lower()
                    work_model = "Remoto" if is_remote else "Presencial"

                    jobs.append(
                        JobResponseItem(
                            id=f"tb-{len(jobs)+1}",
                            title=title_text,
                            company="Trabalha Brasil / BNE Partner",
                            location=loc,
                            url=full_url,
                            source="trabalha_brasil",
                            description=f"{title_text} em {loc} via Trabalha Brasil / BNE",
                            publishedAt=datetime.now(timezone.utc).isoformat(),
                            workModel=work_model
                        )
                    )

            except Exception as err:
                logger.warning(f"[TrabalhaBrasil] Erro na requisição para {url}: {err}")

    logger.info(f"[TrabalhaBrasil] Coletadas {len(jobs)} vagas para query '{raw_query}'")
    return jobs
