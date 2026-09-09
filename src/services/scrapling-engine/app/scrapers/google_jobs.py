import json
import logging
import re
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
import httpx
from bs4 import BeautifulSoup
try:
    from curl_cffi import requests as curl_requests
except ImportError:
    curl_requests = None

from app.schemas import JobResponseItem

logger = logging.getLogger("scrapling-engine.google_jobs")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
}

def parse_google_relative_date(date_str: str) -> str:
    """Converte strings de data relativa do Google em ISO string UTC."""
    if not date_str:
        return datetime.now(timezone.utc).isoformat()

    cleaned = date_str.lower().strip()
    now = datetime.now(timezone.utc)

    if any(k in cleaned for k in ["hoje", "agora", "today", "hora", "hour", "minuto", "minute"]):
        return now.isoformat()
    if "ontem" in cleaned or "yesterday" in cleaned:
        return (now - timedelta(days=1)).isoformat()

    days_match = re.search(r"(\d+)\s*(?:dia|day)", cleaned)
    if days_match:
        days = int(days_match.group(1))
        return (now - timedelta(days=days)).isoformat()

    weeks_match = re.search(r"(\d+)\s*(?:semana|week)", cleaned)
    if weeks_match:
        weeks = int(weeks_match.group(1))
        return (now - timedelta(days=weeks * 7)).isoformat()

    return now.isoformat()


async def scrape_google_jobs(
    query: Optional[str] = "desenvolvedor",
    location: Optional[str] = None,
    limit: int = 20,
    options: Optional[Dict[str, Any]] = None,
) -> List[JobResponseItem]:
    """
    Scraper resiliente em camadas para o ecossistema Google Jobs:
    1. Parsing de Google Jobs HTL (ibp=htl;jobs) via stealth session
    2. Fallback para Google RSS de oportunidades e vagas em tempo real
    """
    raw_query = (query or "desenvolvedor").strip()
    full_search_term = f"vagas {raw_query}"
    if location:
        full_search_term += f" em {location}"

    jobs: List[JobResponseItem] = []
    seen_urls = set()

    # Estratégia 1: Google Jobs DOM via curl_cffi se disponível
    if curl_requests:
        try:
            encoded_query = urllib.parse.quote_plus(full_search_term)
            target_url = f"https://www.google.com/search?q={encoded_query}&ibp=htl;jobs&hl=pt-BR&gl=br"
            logger.info(f"[GoogleJobs] Consultando Google Jobs: {target_url}")

            session = curl_requests.Session(impersonate="chrome120")
            session.headers.update(HEADERS)
            resp = session.get(target_url, timeout=15)

            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                items = soup.select('[role="listitem"], .iR1T8b, .PwjeAc, .gws-plugins-horizon-jobs__li-ed, .zxUu0c')

                for item in items:
                    if len(jobs) >= limit:
                        break

                    title_el = item.select_one('.BjA41b, .P822W, [role="heading"], .tNxQIb, .KL4y9e')
                    if not title_el:
                        continue
                    title = title_el.get_text(strip=True)
                    if not title or len(title) < 3 or ("google" in title.lower() and len(title) < 10):
                        continue

                    company_el = item.select_one('.vL2fd, .nCinv, .wJEf8c, .I2Cbhb, .sMzDhe')
                    company = company_el.get_text(strip=True) if company_el else "Google Jobs"

                    loc_el = item.select_one('.Qk80Jf, .sMzDhe, .I6kR9c')
                    loc = loc_el.get_text(strip=True) if loc_el else (location or "Brasil")

                    date_el = item.select_one('.LL4d2b, .k0v3pd, .Su4scb, .WbZsve')
                    date_str = date_el.get_text(strip=True) if date_el else ""
                    pub_date = parse_google_relative_date(date_str)

                    salary_el = item.select_one('.J1gsFd, .I2Cbhb, .LL4d2b')
                    salary = salary_el.get_text(strip=True) if salary_el and "R$" in salary_el.get_text() else None

                    link_el = item.select_one('a[data-share-url], a.MQU1A, a[href^="http"]')
                    job_url = link_el.get("data-share-url") or link_el.get("href") if link_el else ""
                    if not job_url or "google.com" in job_url:
                        job_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(title + ' ' + company)}&ibp=htl;jobs"

                    if job_url in seen_urls:
                        continue
                    seen_urls.add(job_url)

                    jobs.append(
                        JobResponseItem(
                            id=f"google-jobs-{len(jobs)+1}",
                            title=title,
                            company=company,
                            location=loc,
                            url=job_url,
                            source="google_jobs",
                            description=f"{title} na {company} (Google Jobs)",
                            publishedAt=pub_date,
                            salary=salary,
                            workModel="Remoto" if "remoto" in (title + loc).lower() else "Presencial"
                        )
                    )
        except Exception as e:
            logger.warning(f"[GoogleJobs] Estratégia 1 falhou: {e}")

    # Estratégia 2: Fallback Google RSS feed para busca em tempo real de vagas
    if len(jobs) < limit:
        try:
            encoded_query = urllib.parse.quote_plus(full_search_term)
            rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
            logger.info(f"[GoogleJobs] Consultando Google Feed: {rss_url}")

            async with httpx.AsyncClient(headers=HEADERS, timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(rss_url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "xml")
                    items = soup.find_all("item")

                    for item in items:
                        if len(jobs) >= limit:
                            break

                        raw_title = item.title.get_text(strip=True) if item.title else ""
                        link = item.link.get_text(strip=True) if item.link else ""
                        pub_date_raw = item.pubDate.get_text(strip=True) if item.pubDate else ""

                        if not raw_title or not link:
                            continue

                        # Separar "Título da Vaga - Nome da Empresa / Fonte"
                        parts = raw_title.rsplit(" - ", 1)
                        title = parts[0].strip()
                        company = parts[1].strip() if len(parts) > 1 else "Google Jobs"

                        if link in seen_urls:
                            continue
                        seen_urls.add(link)

                        jobs.append(
                            JobResponseItem(
                                id=f"google-feed-{len(jobs)+1}",
                                title=title,
                                company=company,
                                location=location or "Brasil / Remoto",
                                url=link,
                                source="google_jobs",
                                description=f"{title} - Oportunidade agregada via Google Jobs",
                                publishedAt=pub_date_raw or datetime.now(timezone.utc).isoformat(),
                                workModel="Remoto" if "remoto" in raw_title.lower() or "home office" in raw_title.lower() else "Presencial"
                            )
                        )
        except Exception as e:
            logger.warning(f"[GoogleJobs] Estratégia 2 falhou: {e}")

    logger.info(f"[GoogleJobs] Coletadas {len(jobs)} vagas para query '{raw_query}'")
    return jobs
