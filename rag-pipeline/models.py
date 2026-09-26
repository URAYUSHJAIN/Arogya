"""Lazy, process-wide loaders for the retrieval models.

- Dense embeddings: sentence-transformers/all-MiniLM-L6-v2 (retrieval only)
- Cross-encoder reranker: BAAI/bge-reranker-base (retrieval only)

Neither model generates answers.
"""
from __future__ import annotations

import threading

import numpy as np

from config import settings

_lock = threading.Lock()
_embedder = None
_reranker = None


def get_embedder():
    global _embedder
    with _lock:
        if _embedder is None:
            from sentence_transformers import SentenceTransformer
            _embedder = SentenceTransformer(settings.embedding_model, device="cpu")
    return _embedder


def get_reranker():
    global _reranker
    with _lock:
        if _reranker is None:
            from sentence_transformers import CrossEncoder
            _reranker = CrossEncoder(settings.reranker_model, max_length=512, device="cpu")
    return _reranker


def embed(texts: list[str]) -> np.ndarray:
    vecs = get_embedder().encode(
        texts, batch_size=32, normalize_embeddings=True, show_progress_bar=False
    )
    return np.asarray(vecs, dtype=np.float32)


def rerank(query: str, passages: list[str]) -> list[float]:
    """Cross-encoder relevance, sigmoid-normalised to 0..1."""
    if not passages:
        return []
    logits = get_reranker().predict(
        [(query, p) for p in passages], batch_size=16, show_progress_bar=False,
        activation_fct=_identity,
    )
    logits = np.asarray(logits, dtype=np.float64).reshape(-1)
    return (1.0 / (1.0 + np.exp(-logits))).tolist()


def _identity(x):
    return x


def status() -> dict:
    return {
        "embedding_model": settings.embedding_model,
        "embedding_loaded": _embedder is not None,
        "reranker_model": settings.reranker_model,
        "reranker_loaded": _reranker is not None,
    }
