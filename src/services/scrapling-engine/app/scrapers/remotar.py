import json
import logging
import re
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import httpx

from app.schemas import JobResponseItem

logger = logging.getLogger("scrapling-engine.remotar")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

def parse_iso_date(date_str: Optional[str]) -> str:
    if not date_str:
        return datetime.now(timezone.utc).isoformat()
    try:
        # Tenta formatar caso venha com offset ou ISO
        dt = datetime.fromisoformat(date_str)
        return dt.astimezone(timezone.utc).isoformat()
    except Exception:
        return datetime.now(timezone.utc).isoformat()

async def scrape_remotar(
    query: Optional[str] = "desenvolvedor",
    location: Optional[str] = None,
    limit: int = 20,
    options: Optional[Dict[str, Any]] = None,
) -> List[JobResponseItem]:
    """
    Scraper de alta velocidade e precisão para a plataforma Remotar via API oficial (https://api.remotar.com.br/jobs).
    """
    raw_query = (query or "desenvolvedor").strip()
    jobs: List[JobResponseItem] = []
    seen_ids = set()

    # Parâmetros de busca da API Remotar
    query_variants = [
        f"search={urllib.parse.quote_plus(raw_query)}",
        f"search={urllib.parse.quote_plus(raw_query.split()[0])}" if " " in raw_query else None,
        "",  # Últimas vagas gerais como fallback
    ]

    async with httpx.AsyncClient(headers=HEADERS, timeout=15.0, follow_redirects=True) as client:
        for q_param in query_variants:
            if q_param is None or len(jobs) >= limit:
                continue

            api_url = f"https://api.remotar.com.br/jobs?{q_param}" if q_param else "https://api.remotar.com.br/jobs"
            logger.info(f"[Remotar] Consultando API: {api_url}")

            try:
                response = await client.get(api_url)
                if response.status_code != 200:
                    logger.warning(f"[Remotar] API respondeu com status {response.status_code}")
                    continue

                data = response.json()
                raw_items = data.get("data", [])
                if not isinstance(raw_items, list):
                    continue

                for item in raw_items:
                    if len(jobs) >= limit:
                        break
                    if not isinstance(item, dict):
                        continue

                    job_id = str(item.get("id") or "")
                    if job_id and job_id in seen_ids:
                        continue
                    if job_id:
                        seen_ids.add(job_id)

                    title = item.get("title") or ""
                    if not title:
                        continue

                    company_obj = item.get("company") or {}
                    company_name = company_obj.get("name") if isinstance(company_obj, dict) else "Remotar"

                    desc = item.get("description") or f"{title} na {company_name}"
                    # Limpeza de HTML básico na descrição se houver
                    clean_desc = re.sub(r"<[^>]+>", " ", desc).strip()

                    # Montar URL amigável
                    slug = item.get("slug") or ""
                    company_slug = company_obj.get("slug") or "empresa" if isinstance(company_obj, dict) else "empresa"
                    apply_url = item.get("applicationUrl") or item.get("applyUrl")
                    
                    if job_id:
                        job_url = f"https://remotar.com.br/job/{job_id}/{company_slug}/{slug}" if slug else f"https://remotar.com.br/job/{job_id}"
                    else:
                        job_url = apply_url or "https://remotar.com.br"

                    # Salário se informado
                    salary_obj = item.get("jobSalary")
                    salary_str = None
                    if isinstance(salary_obj, dict) and salary_obj.get("type") != "uninformed":
                        s_from = salary_obj.get("from")
                        s_to = salary_obj.get("to")
                        currency = salary_obj.get("currency") or "R$"
                        if s_from and s_to:
                            salary_str = f"{currency} {s_from} - {s_to}"
                        elif s_from:
                            salary_str = f"{currency} {s_from}"

                    pub_date = parse_iso_date(item.get("createdAt") or item.get("updatedAt"))

                    jobs.append(
                        JobResponseItem(
                            id=f"remotar-{job_id}" if job_id else f"remotar-{len(jobs)+1}",
                            title=title.strip(),
                            company=company_name.strip() if company_name else "Remotar",
                            location="Remoto",
                            url=job_url,
                            source="remotar",
                            description=clean_desc[:400].strip(),
                            publishedAt=pub_date,
                            salary=salary_str,
                            workModel="Remoto",
                            extra={"applyUrl": apply_url} if apply_url else {}
                        )
                    )

            except Exception as err:
                logger.warning(f"[Remotar] Erro ao processar requisição: {err}")

    logger.info(f"[Remotar] Coletadas {len(jobs)} vagas com sucesso para query '{raw_query}'")
    return jobs
