"""Central configuration. Every value is overridable through environment
variables or rag-pipeline/.env (never committed)."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def _load_dotenv(path: Path) -> None:
    """Minimal .env loader (no extra dependency). Existing env vars win."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


_load_dotenv(BASE_DIR / ".env")          # optional backend-only overrides
_load_dotenv(BASE_DIR.parent / ".env")   # shared with docker-compose.yml (POSTGRES_PASSWORD, DATABASE_URL)


def _float(name: str, default: float) -> float:
    return float(os.environ.get(name, default))


def _int(name: str, default: int) -> int:
    return int(os.environ.get(name, default))


@dataclass(frozen=True)
class Settings:
    database_url: str = os.environ.get("DATABASE_URL", "postgresql://postgres@localhost:5432/arogya_rag")
    corpus_dir: Path = Path(os.environ.get("CORPUS_DIR", BASE_DIR / "corpus"))
    upload_dir: Path = Path(os.environ.get("UPLOAD_DIR", BASE_DIR / "uploads"))

    embedding_model: str = os.environ.get("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    reranker_model: str = os.environ.get("RERANKER_MODEL", "BAAI/bge-reranker-base")

    # Generation provider is explicit. No cloud provider exists in this codebase.
    generation_provider: str = os.environ.get("GENERATION_PROVIDER", "transformers")
    local_model_name: str = os.environ.get("LOCAL_MODEL_NAME", "Qwen/Qwen2.5-0.5B-Instruct")
    ollama_url: str = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434")
    max_new_tokens: int = _int("MAX_NEW_TOKENS", 220)

    # Retrieval bounds (kept small for a responsive live demo)
    bm25_top_k: int = _int("BM25_TOP_K", 20)
    dense_top_k: int = _int("DENSE_TOP_K", 20)
    rrf_k: int = _int("RRF_K", 60)
    rerank_candidates: int = _int("RERANK_CANDIDATES", 14)
    context_top_k: int = _int("CONTEXT_TOP_K", 6)

    # Sufficiency gate thresholds (reranker scores are sigmoid-normalised 0..1)
    min_rerank_score: float = _float("MIN_RERANK_SCORE", 0.30)
    strong_rerank_score: float = _float("STRONG_RERANK_SCORE", 0.70)
    min_query_coverage: float = _float("MIN_QUERY_COVERAGE", 0.50)
    evidence_keep_ratio: float = _float("EVIDENCE_KEEP_RATIO", 0.05)

    # Claim verification
    min_claim_support: float = _float("MIN_CLAIM_SUPPORT", 0.5)

    cors_origins: list[str] = field(
        default_factory=lambda: os.environ.get(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
    )


settings = Settings()
