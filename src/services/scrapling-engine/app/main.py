import time
import base64
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List

from fastapi import FastAPI, HTTPException, Request, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.schemas import (
    ScrapeRequest,
    ScrapeResponse,
    JobResponseItem,
    HealthResponse,
    CVParseRequest,
    CVParseResponse,
    CVAnalyzeRequest,
    CVAnalyzeResponse,
    CVAnalysisData,
)
from app.scrapers import (
    scrape_catho,
    scrape_google_jobs,
    scrape_remotar,
    scrape_trampos,
    scrape_infojobs,
    scrape_trabalha_brasil,
    scrape_geekhunter,
    scrape_glassdoor,
)
from app.services.cv_parser import parse_cv_document
from app.services.cv_analyzer import analyze_cv_document

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s"
)
logger = logging.getLogger("scrapling-engine")

app = FastAPI(
    title="Buscavag Scrapling Engine & AI",
    description="Microserviço Python de alta performance para extração resiliente de vagas e pipeline de IA para análise de currículos",
    version="1.1.0"
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
        version="1.1.0",
        engine="scrapling+gemini-ai",
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

        if source_name == "catho":
            jobs = await scrape_catho(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name in ["google_jobs", "googlejobs", "google"]:
            jobs = await scrape_google_jobs(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name == "remotar":
            jobs = await scrape_remotar(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name in ["trampos", "trampos.co", "trampos_co"]:
            jobs = await scrape_trampos(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name in ["infojobs", "info_jobs"]:
            jobs = await scrape_infojobs(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name in ["trabalha_brasil", "trabalhabrasil", "bne"]:
            jobs = await scrape_trabalha_brasil(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name in ["geekhunter", "geek_hunter"]:
            jobs = await scrape_geekhunter(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name == "glassdoor":
            jobs = await scrape_glassdoor(
                query=payload.query,
                location=payload.location,
                limit=payload.limit or 20,
                options=payload.options
            )
        elif source_name in ["mock", "test", "ping"]:
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
            logger.info(f"Fonte '{source_name}' desconhecida ou ainda não migrada para Scrapling Engine.")
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

# --- Endpoints de Extração e IA para Currículo (Fase 37) ---

@app.post("/cv/parse", response_model=CVParseResponse)
async def parse_cv(payload: CVParseRequest):
    """
    Extrai texto e métricas estruturadas de arquivos PDF/Word.
    """
    start_time = time.time()
    try:
        file_bytes = None
        if payload.contentBase64:
            file_bytes = base64.b64decode(payload.contentBase64)

        result = parse_cv_document(
            file_path=payload.filePath,
            file_bytes=file_bytes,
            filename=payload.filename
        )

        elapsed_ms = (time.time() - start_time) * 1000
        return CVParseResponse(
            success=True,
            text=result["text"],
            wordCount=result["word_count"],
            charCount=result["char_count"],
            detectedSections=result["detected_sections"],
            preview=result["preview"],
            executionTimeMs=round(elapsed_ms, 2)
        )
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        logger.error(f"Erro ao extrair texto do currículo: {str(e)}", exc_info=True)
        return CVParseResponse(
            success=False,
            text="",
            wordCount=0,
            charCount=0,
            detectedSections=[],
            preview="",
            error=str(e),
            executionTimeMs=round(elapsed_ms, 2)
        )

@app.post("/cv/analyze", response_model=CVAnalyzeResponse)
async def analyze_cv(payload: CVAnalyzeRequest):
    """
    Processa o currículo e executa a análise de IA (Gemini ou Heurística semântica).
    Retorna Senioridade, Hard/Soft Skills, Resumo Executivo, Strengths e Tips.
    """
    start_time = time.time()
    try:
        cv_text = payload.cvText or ""

        # Se não enviou o texto pronto, mas enviou o filePath, extrai primeiro
        if not cv_text and payload.filePath:
            parsed = parse_cv_document(file_path=payload.filePath, filename=payload.filename)
            cv_text = parsed["text"]

        if not cv_text.strip():
            raise ValueError("Nenhum texto de currículo disponível para análise.")

        analysis = await analyze_cv_document(cv_text)

        elapsed_ms = (time.time() - start_time) * 1000
        return CVAnalyzeResponse(
            success=True,
            analysis=CVAnalysisData(**analysis),
            rawTextPreview=cv_text[:500] if len(cv_text) > 500 else cv_text,
            wordCount=len(cv_text.split()),
            executionTimeMs=round(elapsed_ms, 2)
        )
    except Exception as e:
        elapsed_ms = (time.time() - start_time) * 1000
        logger.error(f"Erro na análise de IA do currículo: {str(e)}", exc_info=True)
        return CVAnalyzeResponse(
            success=False,
            analysis=None,
            rawTextPreview="",
            wordCount=0,
            error=str(e),
            executionTimeMs=round(elapsed_ms, 2)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
