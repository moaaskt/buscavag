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

# --- Schemas para Extração e Análise de Currículo (Fase 37) ---

class CVParseRequest(BaseModel):
    filePath: Optional[str] = Field(None, description="Caminho do arquivo local (PDF ou DOCX)")
    contentBase64: Optional[str] = Field(None, description="Conteúdo em base64 do arquivo")
    filename: Optional[str] = Field(None, description="Nome original do arquivo com extensão")

class CVParseResponse(BaseModel):
    success: bool
    text: str = ""
    wordCount: int = 0
    charCount: int = 0
    detectedSections: List[str] = Field(default_factory=list)
    preview: str = ""
    error: Optional[str] = None
    executionTimeMs: Optional[float] = None

class CVAnalyzeRequest(BaseModel):
    filePath: Optional[str] = Field(None, description="Caminho do arquivo do currículo")
    cvText: Optional[str] = Field(None, description="Texto extraído do currículo para análise direta")
    filename: Optional[str] = Field(None, description="Nome do arquivo")

class CVAnalysisData(BaseModel):
    detected_role: str
    detected_seniority: str
    hard_skills: List[str] = Field(default_factory=list)
    soft_skills: List[str] = Field(default_factory=list)
    summary: str
    strengths: List[str] = Field(default_factory=list)
    improvement_tips: List[str] = Field(default_factory=list)
    source: Optional[str] = "ai"

class CVAnalyzeResponse(BaseModel):
    success: bool
    analysis: Optional[CVAnalysisData] = None
    rawTextPreview: Optional[str] = None
    wordCount: Optional[int] = 0
    error: Optional[str] = None
    executionTimeMs: Optional[float] = None
