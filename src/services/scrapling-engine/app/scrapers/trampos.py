import json
import logging
import re
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import httpx

from app.schemas import JobResponseItem

logger = logging.getLogger("scrapling-engine.trampos")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://trampos.co/oportunidades",
}

def parse_iso_date(date_str: Optional[str]) -> str:
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    try:
        dt = datetime.fromisoformat(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

async def scrape_trampos(
    query: Optional[str] = "desenvolvedor",
    location: Optional[str] = None,
    limit: int = 20,
    options: Optional[Dict[str, Any]] = None,
) -> List[JobResponseItem]:
    """
    Scraper de alta velocidade para a plataforma Trampos.co via API oficial v2.
    """
    raw_query = (query or "desenvolvedor").strip()
    jobs: List[JobResponseItem] = []
    seen_ids = set()

    api_url = "https://trampos.co/api/v2/opportunities"

    async with httpx.AsyncClient(headers=HEADERS, timeout=15.0, follow_redirects=True) as client:
        try:
            logger.info(f"[Trampos] Consultando API oficial: {api_url}")
            response = await client.get(api_url)

            if response.status_code == 200:
                data = response.json()
                opps = data.get("opportunities", [])

                for opp in opps:
                    if len(jobs) >= limit:
                        break
                    if not isinstance(opp, dict):
                        continue

                    opp_id = str(opp.get("id") or "")
                    if opp_id in seen_ids:
                        continue
                    seen_ids.add(opp_id)

                    title = opp.get("name") or opp.get("title") or ""
                    if not title:
                        continue

                    company_obj = opp.get("company") or {}
                    company_name = (
                        opp.get("custom_company_name")
                        or (company_obj.get("name") if isinstance(company_obj, dict) else "Trampos.co")
                        or "Trampos.co"
                    )

                    city = opp.get("city") or ""
                    state = opp.get("state") or ""
                    loc = f"{city}, {state}".strip(", ") if city or state else (location or "Brasil / Remoto")

                    is_hybrid = bool(opp.get("hybrid"))
                    is_remote = "remoto" in (title + " " + loc).lower() or not city
                    work_model = "Híbrido" if is_hybrid else ("Remoto" if is_remote else "Presencial")

                    salary_raw = opp.get("salary")
                    salary = salary_raw if salary_raw and "NÃO DIVULGADA" not in salary_raw.upper() else None

                    # Gerar URL amigável
                    slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
                    job_url = f"https://trampos.co/oportunidades/{opp_id}-{slug}" if opp_id else "https://trampos.co/oportunidades"

                    pub_date = parse_iso_date(opp.get("published_at"))

                    jobs.append(
                        JobResponseItem(
                            id=f"trampos-{opp_id}" if opp_id else f"trampos-{len(jobs)+1}",
                            title=title.strip(),
                            company=company_name.strip(),
                            location=loc,
                            url=job_url,
                            source="trampos",
                            description=f"{title} na empresa {company_name} ({loc})",
                            publishedAt=pub_date,
                            salary=salary,
                            workModel=work_model,
                            extra={"category": opp.get("category_name")}
                        )
                    )
        except Exception as e:
            logger.warning(f"[Trampos] Erro ao consultar API: {e}")

    logger.info(f"[Trampos] Coletadas {len(jobs)} vagas com sucesso para query '{raw_query}'")
    return jobs
