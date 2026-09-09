from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ScrapeRequest(BaseModel):
    source: str = Field(..., description="Identificador da plataforma fonte (ex: 'catho', 'google_jobs', 'remotar')")
    query: Optional[str] = Field("desenvolvedor", description="Termo de pesquisa de vaga")
    location: Optional[str] = Field(None, description="Filtro opcional de localização/cidade")
    limit: Optional[int] = Field(20, description="Limite máximo de vagas a extrair")
    options: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Opções extras para o coletor específico")

class JobResponseItem(BaseModel):
    id: Optional[str] = None
    title: str
    company: str
    location: str
    url: str
    source: str
    description: Optional[str] = ""
    publishedAt: Optional[str] = None
    salary: Optional[str] = None
    workModel: Optional[str] = None
    extra: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ScrapeResponse(BaseModel):
    success: bool
    source: str
    count: int
    jobs: List[JobResponseItem] = Field(default_factory=list)
    error: Optional[str] = None
    executionTimeMs: Optional[float] = None

class HealthResponse(BaseModel):
    status: str
    version: str
    engine: str
    timestamp: str
