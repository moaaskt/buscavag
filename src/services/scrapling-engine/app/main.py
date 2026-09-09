import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import ScrapeRequest, ScrapeResponse, JobResponseItem, HealthResponse

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("scrapling-engine")

app = FastAPI(
    title="Buscavag Scrapling Engine",
    description="Microserviço Python de alta performance para extração resiliente de vagas via Scrapling",
    version="1.0.0"
)

# Permite chamadas de rede internas/locais
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Endpoint de checagem de saúde e readiness do motor Python"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        engine="scrapling",
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_jobs(payload: ScrapeRequest):
    """
    Roteador de scraping por fonte.
    Recebe solicitação de extração e despacha para o coletor Scrapling correspondente.
    """
    start_time = time.time()
    source_name = payload.source.lower().strip()
    logger.info(f"Recebida solicitação de scrape para fonte '{source_name}', query='{payload.query}', limit={payload.limit}")

    try:
        jobs: List[JobResponseItem] = []

        # Roteamento básico / mockup de validação para a fundação (Fase 32)
        # Coletores reais específicos serão integrados nas Fases 34 e 35
        if source_name in ["mock", "test", "ping"]:
            jobs = [
                JobResponseItem(
                    id=f"test-{i}",
                    title=f"Vaga Teste {payload.query or 'Desenvolvedor'} #{i+1}",
                    company="Tech Corp Test",
                    location=payload.location or "Remoto",
                    url=f"https://example.com/jobs/test-{i}",
                    source=source_name,
                    description="Descrição demonstrativa de vaga coletada via Scrapling Engine.",
                    publishedAt=datetime.now(timezone.utc).isoformat(),
                    workModel="Remoto"
                )
                for i in range(min(payload.limit or 5, 5))
            ]
        else:
            # Placeholder amigável para coletores registrados que serão expandidos
            logger.info(f"Fonte '{source_name}' registrada no catálogo Scrapling Engine.")
            jobs = []

        elapsed_ms = (time.time() - start_time) * 1000
        return ScrapeResponse(
            success=True,
            source=source_name,
            count=len(jobs),
            jobs=jobs,
            executionTimeMs=round(elapsed_ms, 2)
        )

    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        logger.error(f"Erro durante scraping de '{source_name}': {str(e)}", exc_info=True)
        return ScrapeResponse(
            success=False,
            source=source_name,
            count=0,
            jobs=[],
            error=str(e),
            executionTimeMs=round(elapsed_ms, 2)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
