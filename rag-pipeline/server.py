"""FastAPI application — the only component the frontend talks to.

Run:  python server.py        (http://127.0.0.1:8010)
"""
from __future__ import annotations

import json
import os
import re
import shutil
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

import uvicorn
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import conflict_and_lifecycle as cl
import database as db
import evaluator
import generation
import ingest
import models
import pipeline
import privacy
import rbac
from config import settings
from retriever import INDEX


def startup() -> None:
    ingest.bootstrap()
    INDEX.load()
    pipeline.pii_registry(refresh=True)
    cl.subject_vocabulary(refresh=True)
    evaluator.sync_questions()
    models.get_embedder()
    models.get_reranker()


@asynccontextmanager
async def lifespan(app: FastAPI):
    startup()
    yield


app = FastAPI(title="Arogya Evidence-Before-Generation Engine", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_methods=["*"],
                   allow_headers=["*"])


class QueryRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)
    role: str


class AuditEventRequest(BaseModel):
    event_type: str = Field(..., pattern=r"^[a-z_]{3,40}$")
    role: Optional[str] = None
    details: dict = Field(default_factory=dict)


def _role_or_403(role: Optional[str]) -> rbac.UserContext:
    try:
        return rbac.build_user_context(role)
    except rbac.AuthorizationError as exc:
        raise HTTPException(status_code=403, detail=str(exc))


@app.get("/api/health")
def health():
    db_ok = db.ping()
    try:
        gen = generation.get_provider().health_check()
    except generation.GenerationUnavailable as exc:
        gen = {"provider": settings.generation_provider, "error": str(exc), "loaded": False}
    return {"status": "ok" if db_ok else "degraded", "database": db_ok,
            "index": {"chunks": len(INDEX.chunks), "version": INDEX.version},
            "models": models.status(), "generation": gen}


@app.get("/api/roles")
def roles():
    return [{"role": r, "description": spec["description"],
             "categories": [rbac.CATEGORY_LABELS[c] for c in spec["categories"]]}
            for r, spec in rbac.ROLE_POLICY.items()]


@app.get("/api/documents")
def documents(role: Optional[str] = None):
    """Corpus catalogue (metadata only). `accessible` reflects the server-side
    ACL for the given role; restricted content is never returned here."""
    ctx = _role_or_403(role) if role else None
    rows = db.fetch_all(
        """SELECT d.document_id, d.title, d.category, d.source_type, d.source_file, d.department,
                  d.classification, d.current_version AS version, d.status,
                  v.effective_from, v.effective_to, v.supersedes, v.superseded_by,
                  (SELECT count(*) FROM chunks c WHERE c.document_id = d.document_id) AS chunks,
                  (SELECT count(*) FROM table_rows t WHERE t.document_id = d.document_id) AS table_rows,
                  (SELECT coalesce(sum(pii_redactions),0) FROM chunks c WHERE c.document_id = d.document_id) AS pii_redactions
           FROM documents d LEFT JOIN document_versions v
             ON v.document_id = d.document_id AND v.version = d.current_version
           ORDER BY d.source_file""")
    for r in rows:
        r["accessible"] = (r["document_id"] in ctx.allowed_document_ids) if ctx else None
        r["category_label"] = rbac.CATEGORY_LABELS.get(r["category"], r["category"])
        for k in ("effective_from", "effective_to"):
            r[k] = r[k].isoformat() if r[k] else None
    active = sum(1 for r in rows if r["status"] == "active")
    return {"documents": rows, "total": len(rows), "active": active}


@app.get("/api/documents/{document_id}")
def document_detail(document_id: str, role: str):
    ctx = _role_or_403(role)
    if document_id not in ctx.allowed_document_ids:
        raise HTTPException(status_code=403, detail=f"{ctx.role} is not authorized for {document_id}")
    doc = db.fetch_one("SELECT * FROM documents WHERE document_id = %s", (document_id,))
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    versions = db.fetch_all(
        """SELECT version, status, effective_from, effective_to, supersedes, superseded_by, ingested_at
           FROM document_versions WHERE document_id = %s ORDER BY ingested_at""", (document_id,))
    chunks = [c for c in INDEX.chunks if c["document_id"] == document_id]
    registry = pipeline.pii_registry()
    rows = db.fetch_all(
        "SELECT chunk_id, table_id, row_id, row_index, columns, cells FROM table_rows "
        "WHERE document_id = %s ORDER BY row_index", (document_id,))
    return {
        "document": doc, "versions": versions,
        "chunks": [{"chunk_id": c["chunk_id"], "chunk_type": c["chunk_type"], "section": c["section"],
                    "section_title": c["section_title"], "heading_path": c["heading_path"],
                    "line_start": c["line_start"], "line_end": c["line_end"], "row_id": c["row_id"],
                    "record_id": c["record_id"], "table_id": c["table_id"],
                    "content": privacy.output_gate(c["content"], registry).text} for c in chunks],
        "table_rows": rows,
    }


@app.get("/api/evidence/{evidence_id:path}")
def evidence(evidence_id: str, role: str):
    """Resolve a citation (chunk id) to its passage — re-authorized server-side."""
    ctx = _role_or_403(role)
    c = INDEX.get_chunk(evidence_id)
    if not c:
        raise HTTPException(status_code=404, detail="Evidence not found")
    if c["document_id"] not in ctx.allowed_document_ids:
        raise HTTPException(status_code=403, detail=f"{ctx.role} is not authorized for this evidence")
    registry = pipeline.pii_registry()
    row = None
    if c["chunk_type"] == "table_row":
        row = db.fetch_one("SELECT table_id, row_id, row_index, columns, cells FROM table_rows "
                           "WHERE chunk_id = %s", (evidence_id,))
    siblings = [{"chunk_id": s["chunk_id"], "section": s["section"], "section_title": s["section_title"],
                 "heading_path": s["heading_path"], "chunk_type": s["chunk_type"], "row_id": s["row_id"],
                 "record_id": s["record_id"], "line_start": s["line_start"], "line_end": s["line_end"],
                 "content": privacy.output_gate(s["content"], registry).text}
                for s in INDEX.chunks if s["document_id"] == c["document_id"]]
    table = None
    if c["table_id"]:
        table = db.fetch_all("SELECT chunk_id, row_id, row_index, columns, cells FROM table_rows "
                             "WHERE document_id = %s AND table_id = %s ORDER BY row_index",
                             (c["document_id"], c["table_id"]))
    return {"evidence": {**{k: c[k] for k in c if k != "index_text"},
                         "content": privacy.output_gate(c["content"], registry).text,
                         "lifecycle": cl.lifecycle_state(c)},
            "row": row, "table": table, "document_chunks": siblings}


@app.post("/api/query")
def query(req: QueryRequest):
    try:
        return pipeline.run_query(req.role, req.query)
    except rbac.AuthorizationError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


_SAFE_NAME = re.compile(r"[^A-Za-z0-9._-]")


@app.post("/api/ingest")
async def ingest_document(file: UploadFile = File(...), document_id: str = Form(None),
                          title: str = Form(None), category: str = Form(None),
                          version: str = Form(None), status: str = Form(None),
                          department: str = Form(None), supersedes: str = Form(None),
                          effective_from: str = Form(None)):
    """Ingest a Markdown / CSV / JSON document through the same parser, privacy
    gate, chunker, ACL materialisation and embedding path as the corpus."""
    name = _SAFE_NAME.sub("_", Path(file.filename or "upload").name)
    if Path(name).suffix.lower() not in (".md", ".markdown", ".csv", ".json"):
        raise HTTPException(status_code=415, detail="Supported upload formats: .md, .csv, .json")
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    dest = settings.upload_dir / name
    with dest.open("wb") as fh:
        shutil.copyfileobj(file.file, fh)
    meta = {k: v for k, v in dict(document_id=document_id, title=title, category=category,
                                  version=version, status=status, department=department,
                                  supersedes=supersedes, effective_from=effective_from).items() if v}
    try:
        result = ingest.ingest_path(dest, meta)
    except (ingest.IngestionError, ingest.UnsupportedFormat, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    INDEX.load()
    pipeline.pii_registry(refresh=True)
    cl.subject_vocabulary(refresh=True)
    with db.transaction() as conn:
        conn.execute("INSERT INTO audit_events (event_type, details) VALUES ('ingest', %s)",
                     (db.jsonb(result),))
    return result


@app.post("/api/evaluate")
def evaluate():
    return evaluator.run_evaluation()


@app.get("/api/evaluation/latest")
def evaluation_latest():
    run = evaluator.latest_run()
    if not run:
        raise HTTPException(status_code=404, detail="No evaluation run yet")
    return run


@app.get("/api/privacy/status")
def privacy_status():
    row = db.fetch_one(
        """SELECT count(*) AS queries,
                  count(*) FILTER (WHERE (privacy->>'leak_detected_in_delivered_answer')::boolean) AS leaks,
                  coalesce(sum((privacy->>'output_identifiers_blocked')::int), 0) AS blocked,
                  coalesce(sum((privacy->>'query_identifiers_redacted')::int), 0) AS query_redactions
           FROM audit_events WHERE event_type = 'query'""")
    ingest_red = db.fetch_one("SELECT coalesce(sum(pii_redactions),0) AS n FROM chunks")["n"]
    latest = evaluator.latest_run(summary_only=True)
    return {"queries_scanned": row["queries"], "leaks_in_delivered_answers": row["leaks"],
            "output_identifiers_blocked": row["blocked"], "query_identifiers_redacted": row["query_redactions"],
            "ingestion_redactions": ingest_red, "registered_identifier_hashes": len(pipeline.pii_registry()),
            "latest_benchmark_pii_leakage": (latest or {}).get("metrics", {}).get("pii_leakage")}


@app.get("/api/audit")
def audit(limit: int = 50):
    return db.fetch_all(
        """SELECT id, created_at, event_type, role, query_redacted, status, retrieved_document_ids,
                  citation_ids, conflict_detected, sufficiency, privacy, details
           FROM audit_events ORDER BY created_at DESC LIMIT %s""", (min(limit, 200),))


@app.post("/api/audit/events")
def audit_event(req: AuditEventRequest):
    """Client-side UI events (e.g. citation opened). Stored as untrusted telemetry."""
    if req.role:
        _role_or_403(req.role)
    safe_details = {str(k)[:60]: privacy.redact_text(str(v)).text[:500]
                    for k, v in list(req.details.items())[:20]}
    with db.transaction() as conn:
        row = conn.execute(
            "INSERT INTO audit_events (event_type, role, details) VALUES (%s, %s, %s) RETURNING id",
            (f"ui_{req.event_type}", req.role, db.jsonb(safe_details))).fetchone()
    return {"id": str(row["id"])}


if __name__ == "__main__":
    uvicorn.run(app, host=os.environ.get("API_HOST", "127.0.0.1"), port=int(os.environ.get("API_PORT", "8010")))
