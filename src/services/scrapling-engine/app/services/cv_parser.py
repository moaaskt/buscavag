import io
import os
import re
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("scrapling-engine.cv_parser")

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

try:
    import docx
except ImportError:
    docx = None


def clean_extracted_text(text: str) -> str:
    """Normaliza quebras de linha e remove espaços redundantes mantendo legibilidade."""
    if not text:
        return ""
    # Remove caracteres nulos e de controle
    text = text.replace("\x00", " ")
    # Normaliza quebras de linha múltiplas
    text = re.sub(r"\r\n|\r", "\n", text)
    # Remove espaços excessivos em cada linha
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    # Remove sequências excessivas de linhas vazias
    cleaned_lines = []
    empty_count = 0
    for line in lines:
        if not line:
            empty_count += 1
            if empty_count <= 2:
                cleaned_lines.append("")
        else:
            empty_count = 0
            cleaned_lines.append(line)
    return "\n".join(cleaned_lines).strip()


def extract_text_from_pdf(source: str | bytes) -> str:
    """Extrai texto de um arquivo ou buffer de PDF usando pypdf."""
    if PdfReader is None:
        raise RuntimeError("Biblioteca pypdf não instalada no ambiente Python.")

    if isinstance(source, bytes):
        reader = PdfReader(io.BytesIO(source))
    else:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Arquivo PDF não encontrado: {source}")
        reader = PdfReader(source)

    text_parts = []
    for idx, page in enumerate(reader.pages):
        try:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        except Exception as e:
            logger.warning(f"Erro ao extrair texto da página {idx + 1}: {e}")

    return clean_extracted_text("\n\n".join(text_parts))


def extract_text_from_docx(source: str | bytes) -> str:
    """Extrai texto de um arquivo ou buffer DOCX usando python-docx."""
    if docx is None:
        raise RuntimeError("Biblioteca python-docx não instalada no ambiente Python.")

    if isinstance(source, bytes):
        doc = docx.Document(io.BytesIO(source))
    else:
        if not os.path.exists(source):
            raise FileNotFoundError(f"Arquivo DOCX não encontrado: {source}")
        doc = docx.Document(source)

    text_parts = []

    # Extrai parágrafos
    for para in doc.paragraphs:
        if para.text.strip():
            text_parts.append(para.text)

    # Extrai células de tabelas
    for table in doc.tables:
        for row in table.rows:
            row_texts = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_texts:
                text_parts.append(" | ".join(row_texts))

    return clean_extracted_text("\n".join(text_parts))


def parse_cv_document(file_path: Optional[str] = None, file_bytes: Optional[bytes] = None, filename: Optional[str] = None) -> Dict[str, Any]:
    """
    Função unificada para extrair texto e estatísticas de currículos (PDF ou DOCX).
    """
    ext = ""
    if filename:
        ext = os.path.splitext(filename)[1].lower()
    elif file_path:
        ext = os.path.splitext(file_path)[1].lower()

    target = file_bytes if file_bytes is not None else file_path
    if target is None:
        raise ValueError("Nenhum arquivo ou buffer fornecido para extração.")

    text = ""
    if ext == ".pdf" or (file_bytes and file_bytes.startswith(b"%PDF")):
        text = extract_text_from_pdf(target)
    elif ext in [".docx", ".doc"]:
        try:
            text = extract_text_from_docx(target)
        except Exception as e:
            logger.warning(f"Falha no parser docx: {e}. Tentando fallback de texto.")
            if isinstance(target, str) and os.path.exists(target):
                with open(target, "r", encoding="utf-8", errors="ignore") as f:
                    text = clean_extracted_text(f.read())
            elif isinstance(target, bytes):
                text = clean_extracted_text(target.decode("utf-8", errors="ignore"))
    else:
        # Fallback genérico para texto
        if isinstance(target, str) and os.path.exists(target):
            with open(target, "r", encoding="utf-8", errors="ignore") as f:
                text = clean_extracted_text(f.read())
        elif isinstance(target, bytes):
            text = clean_extracted_text(target.decode("utf-8", errors="ignore"))

    words = text.split()
    word_count = len(words)
    char_count = len(text)

    # Identificação rápida de seções comuns
    detected_sections = []
    section_patterns = {
        "Experiência": r"(experi[êe]ncia|hist[óo]rico profissional|trajet[óo]ria)",
        "Educação / Formação": r"(forma[çc][ãa]o|educa[çc][ãa]o|gradua[çc][ãa]o|cursos|certifica[çc][õo]es)",
        "Habilidades / Tecnologias": r"(habilidades|skills|compet[êe]ncias|conhecimentos|stacks|tecnologias)",
        "Projetos": r"(projetos|portfolio|portf[óo]lio)",
        "Contato": r"(contato|e-mail|email|telefone|linkedin|github)",
    }

    lower_text = text.lower()
    for section_name, pattern in section_patterns.items():
        if re.search(pattern, lower_text):
            detected_sections.append(section_name)

    return {
        "text": text,
        "word_count": word_count,
        "char_count": char_count,
        "detected_sections": detected_sections,
        "preview": text[:500] if len(text) > 500 else text,
    }
