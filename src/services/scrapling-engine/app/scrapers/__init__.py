"""
Módulos de Scraping Especializados do Scrapling Engine
"""
from .catho import scrape_catho
from .google_jobs import scrape_google_jobs
from .remotar import scrape_remotar

__all__ = ["scrape_catho", "scrape_google_jobs", "scrape_remotar"]
