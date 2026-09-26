"""PostgreSQL persistence layer (source of truth for documents, versions,
chunks, table rows, RBAC, audit events and evaluation runs).

Dense vectors are stored in PostgreSQL as DOUBLE PRECISION[] (pgvector is not
installed on the target laptop). The retriever loads them into an in-memory
matrix at startup; PostgreSQL remains the single source of truth.
"""
from __future__ import annotations

import json
from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from config import settings

SCHEMA_SQL = """
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- A permission grants a role read access to a document category.
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    UNIQUE (role_id, category)
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_file TEXT NOT NULL,
    department TEXT,
    classification TEXT NOT NULL DEFAULT 'internal',
    current_version TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    status TEXT NOT NULL,
    effective_from DATE,
    effective_to DATE,
    supersedes TEXT,
    superseded_by TEXT,
    content_sha256 TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (document_id, version)
);

-- Materialised ACL: which roles may retrieve which document.
CREATE TABLE IF NOT EXISTS document_permissions (
    document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, role_id)
);

CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id TEXT UNIQUE NOT NULL,
    document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    chunk_index INT NOT NULL,
    chunk_type TEXT NOT NULL,
    section TEXT,
    section_title TEXT,
    heading_path TEXT,
    line_start INT,
    line_end INT,
    table_id TEXT,
    row_id TEXT,
    record_id TEXT,
    content TEXT NOT NULL,
    index_text TEXT NOT NULL,
    embedding DOUBLE PRECISION[],
    pii_redactions INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_chunks_document ON chunks(document_id);

CREATE TABLE IF NOT EXISTS table_rows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chunk_id TEXT NOT NULL REFERENCES chunks(chunk_id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(document_id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    table_id TEXT NOT NULL,
    row_id TEXT NOT NULL,
    row_index INT NOT NULL,
    columns JSONB NOT NULL,
    cells JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_table_rows_doc ON table_rows(document_id, table_id);

-- Hashes (never raw values) of identifiers found at ingestion; used by the
-- output privacy gate to detect verbatim identifier leakage.
CREATE TABLE IF NOT EXISTS pii_registry (
    value_hash TEXT PRIMARY KEY,
    pii_type TEXT NOT NULL,
    document_id TEXT NOT NULL,
    token_count INT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type TEXT NOT NULL,
    role TEXT,
    query_redacted TEXT,
    status TEXT,
    authorized_document_ids TEXT[],
    retrieved_document_ids TEXT[],
    context_chunk_ids TEXT[],
    citation_ids TEXT[],
    conflict_detected BOOLEAN,
    sufficiency JSONB,
    privacy JSONB,
    details JSONB
);

CREATE TABLE IF NOT EXISTS evaluation_questions (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    role TEXT NOT NULL,
    question TEXT NOT NULL,
    expected JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS evaluation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    finished_at TIMESTAMPTZ,
    total_questions INT,
    completed_questions INT,
    passed INT,
    metrics JSONB,
    config JSONB
);

CREATE TABLE IF NOT EXISTS evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES evaluation_runs(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    passed BOOLEAN NOT NULL,
    status TEXT,
    checks JSONB,
    details JSONB
);
"""


def connect() -> psycopg.Connection:
    if "YOUR_PASSWORD" in settings.database_url:
        raise psycopg.OperationalError(
            "DATABASE_URL still contains the YOUR_PASSWORD placeholder - edit rag-pipeline/.env")
    return psycopg.connect(settings.database_url, row_factory=dict_row, autocommit=False)


@contextmanager
def transaction() -> Iterator[psycopg.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def ensure_database() -> None:
    """Create the target database on the local server if it does not exist."""
    try:
        connect().close()
        return
    except psycopg.OperationalError as exc:
        if "does not exist" not in str(exc):
            raise
    info = psycopg.conninfo.conninfo_to_dict(settings.database_url)
    target = info.get("dbname")
    admin = psycopg.conninfo.make_conninfo(settings.database_url, dbname="postgres")
    with psycopg.connect(admin, autocommit=True) as conn:
        conn.execute(f'CREATE DATABASE "{target}"')


def init_schema() -> None:
    ensure_database()
    with transaction() as conn:
        conn.execute(SCHEMA_SQL)


def ping() -> bool:
    try:
        with transaction() as conn:
            conn.execute("SELECT 1")
        return True
    except Exception:
        return False


def fetch_all(sql: str, params: Any = None) -> list[dict]:
    with transaction() as conn:
        return list(conn.execute(sql, params).fetchall())


def fetch_one(sql: str, params: Any = None) -> dict | None:
    with transaction() as conn:
        return conn.execute(sql, params).fetchone()


def jsonb(value: Any) -> Jsonb:
    return Jsonb(json.loads(json.dumps(value, default=str)))
