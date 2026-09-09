"""
Módulos de Scraping Especializados do Scrapling Engine
"""
from .catho import scrape_catho
from .google_jobs import scrape_google_jobs
from .remotar import scrape_remotar
from .trampos import scrape_trampos
from .infojobs import scrape_infojobs
from .trabalha_brasil import scrape_trabalha_brasil
from .geekhunter import scrape_geekhunter
from .glassdoor import scrape_glassdoor

__all__ = [
    "scrape_catho",
    "scrape_google_jobs",
    "scrape_remotar",
    "scrape_trampos",
    "scrape_infojobs",
    "scrape_trabalha_brasil",
    "scrape_geekhunter",
    "scrape_glassdoor",
]
