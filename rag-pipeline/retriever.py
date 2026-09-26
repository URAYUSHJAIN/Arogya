"""Permission-aware hybrid retrieval.

    user context (validated role)
      → pre-retrieval ACL: candidate set = chunks of documents the role may read
      → BM25 (rank_bm25) over the authorized candidate set
      → dense cosine search (all-MiniLM-L6-v2) over the authorized candidate set
      → Reciprocal Rank Fusion
      → cross-encoder reranking (BAAI/bge-reranker-base)

Unauthorized chunks are never scored, fused, reranked or returned: they are
removed before any retrieval algorithm sees them.
"""
from __future__ import annotations

import re
import threading
from dataclasses import dataclass, field

import numpy as np
from rank_bm25 import BM25Okapi

import database as db
import models
from config import settings
from rbac import UserContext

STOPWORDS = set("""a an and are as at be by can do does for from has have how i if in is it its
of on or should that the their them there these this to was what when where which who why will
with within must may me my our you your any all per into than then also get given use used""".split())

_TOKEN_RE = re.compile(r"[a-z0-9]+(?:[-/.][a-z0-9]+)*")


def tokenize(text: str) -> list[str]:
    """Lower-cased tokens; hyphenated codes (ERR-404, ROW-01) are kept whole AND
    split, so exact identifiers and their parts both match."""
    out = []
    for tok in _TOKEN_RE.findall(text.lower()):
        tok = tok.strip(".")
        if not tok or tok in STOPWORDS:
            continue
        out.append(tok)
        if any(ch in tok for ch in "-/"):
            out.extend(p for p in re.split(r"[-/]", tok) if p and p not in STOPWORDS)
    return out


@dataclass
class Candidate:
    idx: int
    chunk: dict
    bm25_score: float | None = None
    bm25_rank: int | None = None
    dense_score: float | None = None
    dense_rank: int | None = None
    rrf_score: float = 0.0
    rerank_score: float | None = None
    sources: list[str] = field(default_factory=list)

    def to_evidence(self) -> dict:
        c = self.chunk
        return {
            **{k: c[k] for k in EVIDENCE_FIELDS},
            "retrieval": {
                "sources": self.sources,
                "bm25_score": _r(self.bm25_score), "bm25_rank": self.bm25_rank,
                "dense_score": _r(self.dense_score), "dense_rank": self.dense_rank,
                "rrf_score": _r(self.rrf_score, 5), "rerank_score": _r(self.rerank_score),
            },
        }


EVIDENCE_FIELDS = ("chunk_id", "document_id", "title", "category", "version", "status",
                   "classification", "source_file", "source_type", "chunk_type", "section",
                   "section_title", "heading_path", "line_start", "line_end", "table_id",
                   "row_id", "record_id", "content", "effective_from", "effective_to",
                   "supersedes", "superseded_by", "department")


_ABBREV = [
    (re.compile(r"\bq(\d+)h\b"), r"every \1 hours"),
    (re.compile(r"\bIV/IM\b"), "IV or IM"),
    (re.compile(r"\bPO/IV\b"), "PO or IV"),
    (re.compile(r"\bIV/PO\b"), "IV or PO"),
    (re.compile(r"\bIV\b"), "IV (intravenous)"),
    (re.compile(r"\bIM\b"), "IM (intramuscular)"),
    (re.compile(r"\bPO\b"), "PO (oral)"),
    (re.compile(r"_"), " "),
]


def rerank_text(chunk: dict) -> str:
    """Passage rendering for the cross-encoder only: expands clinical
    abbreviations (q12h, IV, IM, PO) and table field names so structured rows
    are scored as readable text. Stored/cited evidence is unchanged."""
    body = chunk["content"]
    if chunk["chunk_type"] in ("table_row", "json_record"):
        body = body.replace(" | ", "; ")
    for pat, rep in _ABBREV:
        body = pat.sub(rep, body)
    return f"{chunk['title']} | {chunk['heading_path'] or ''}\n{body}"


def _r(x, n=4):
    return None if x is None else round(float(x), n)


class HybridIndex:
    """In-memory retrieval index materialised from PostgreSQL."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.chunks: list[dict] = []
        self.matrix = np.zeros((0, 384), dtype=np.float32)
        self.tokens: list[list[str]] = []
        self.version = 0
        self._bm25_cache: dict[tuple, tuple[BM25Okapi, list[int]]] = {}

    def load(self) -> None:
        rows = db.fetch_all(
            """SELECT c.chunk_id, c.document_id, c.version, c.chunk_type, c.section,
                      c.section_title, c.heading_path, c.line_start, c.line_end, c.table_id,
                      c.row_id, c.record_id, c.content, c.index_text, c.embedding,
                      d.title, d.category, d.status, d.classification, d.source_file,
                      d.source_type, d.department, v.effective_from, v.effective_to,
                      v.supersedes, v.superseded_by
               FROM chunks c
               JOIN documents d ON d.document_id = c.document_id
               LEFT JOIN document_versions v ON v.document_id = c.document_id AND v.version = c.version
               ORDER BY c.document_id, c.chunk_index"""
        )
        for r in rows:
            for k in ("effective_from", "effective_to"):
                r[k] = r[k].isoformat() if r[k] else None
        with self._lock:
            self.chunks = rows
            self.matrix = (np.asarray([r.pop("embedding") for r in rows], dtype=np.float32)
                           if rows else np.zeros((0, 384), dtype=np.float32))
            self.tokens = [tokenize(r["index_text"]) for r in rows]
            self.version += 1
            self._bm25_cache.clear()

    # -- pre-retrieval authorization ------------------------------------
    def authorized_indices(self, ctx: UserContext) -> list[int]:
        return [i for i, c in enumerate(self.chunks) if c["document_id"] in ctx.allowed_document_ids]

    def _bm25_for(self, ctx: UserContext, idxs: list[int]) -> BM25Okapi:
        key = (self.version, ctx.role, tuple(sorted(ctx.allowed_document_ids)))
        if key not in self._bm25_cache:
            self._bm25_cache[key] = (BM25Okapi([self.tokens[i] for i in idxs]), idxs)
        return self._bm25_cache[key][0]

    # -- retrieval stages -----------------------------------------------
    def bm25_search(self, ctx: UserContext, query: str, idxs: list[int], k: int) -> list[tuple[int, float]]:
        if not idxs:
            return []
        q = tokenize(query)
        if not q:
            return []
        scores = self._bm25_for(ctx, idxs).get_scores(q)
        order = np.argsort(-scores)[:k]
        return [(idxs[j], float(scores[j])) for j in order if scores[j] > 0]

    def dense_search(self, query: str, idxs: list[int], k: int) -> list[tuple[int, float]]:
        if not idxs:
            return []
        qv = models.embed([query])[0]
        sims = self.matrix[idxs] @ qv
        order = np.argsort(-sims)[:k]
        return [(idxs[j], float(sims[j])) for j in order]

    def retrieve(self, ctx: UserContext, query: str) -> dict:
        idxs = self.authorized_indices(ctx)
        bm25 = self.bm25_search(ctx, query, idxs, settings.bm25_top_k)
        dense = self.dense_search(query, idxs, settings.dense_top_k)

        cands: dict[int, Candidate] = {}
        for rank, (i, s) in enumerate(bm25, start=1):
            c = cands.setdefault(i, Candidate(i, self.chunks[i]))
            c.bm25_score, c.bm25_rank = s, rank
            c.rrf_score += 1.0 / (settings.rrf_k + rank)
            c.sources.append("bm25")
        for rank, (i, s) in enumerate(dense, start=1):
            c = cands.setdefault(i, Candidate(i, self.chunks[i]))
            c.dense_score, c.dense_rank = s, rank
            c.rrf_score += 1.0 / (settings.rrf_k + rank)
            c.sources.append("dense")

        fused = sorted(cands.values(), key=lambda c: -c.rrf_score)[: settings.rerank_candidates]
        passages = [rerank_text(c.chunk) for c in fused]
        for c, s in zip(fused, models.rerank(query, passages)):
            c.rerank_score = s
        reranked = sorted(fused, key=lambda c: -(c.rerank_score or 0.0))
        return {
            "candidates": reranked,
            "stats": {
                "total_chunks": len(self.chunks),
                "authorized_chunks": len(idxs),
                "excluded_by_acl": len(self.chunks) - len(idxs),
                "bm25_hits": len(bm25),
                "dense_hits": len(dense),
                "fused_candidates": len(fused),
                "authorized_documents": sorted({self.chunks[i]["document_id"] for i in idxs}),
            },
        }

    def get_chunk(self, chunk_id: str) -> dict | None:
        for c in self.chunks:
            if c["chunk_id"] == chunk_id:
                return c
        return None


INDEX = HybridIndex()
