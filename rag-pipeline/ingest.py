"""Ingestion engine: parse → privacy gate → structure-aware chunking →
provenance → PostgreSQL persistence → embeddings.

Supported today: Markdown (hierarchical), CSV (row-atomic tables), JSON
(record-atomic). New formats plug into PARSERS without touching the rest of
the pipeline (PDF/XLSX raise a clear UnsupportedFormat error).

Usage:  python ingest.py            # ingest every file in corpus/
"""
from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

import database as db
import models
import privacy
import rbac
from config import settings

MAX_CHUNK_WORDS = 170
DOC_META_KEYS = ("document_id", "title", "category", "version", "status", "effective_from",
                 "effective_to", "supersedes", "superseded_by", "department", "classification")
VALID_CATEGORIES = set(rbac.CATEGORY_LABELS)
VALID_STATUSES = {"active", "superseded", "retired", "draft"}


class UnsupportedFormat(Exception):
    pass


class IngestionError(Exception):
    pass


@dataclass
class Chunk:
    chunk_type: str               # section_text | table_row | json_record
    content: str                  # display passage (already privacy-redacted)
    section: str | None = None
    section_title: str | None = None
    heading_path: str | None = None
    line_start: int | None = None
    line_end: int | None = None
    table_id: str | None = None
    row_id: str | None = None
    record_id: str | None = None
    row_cells: dict | None = None
    row_columns: list | None = None
    row_index: int | None = None
    pii_redactions: int = 0


@dataclass
class ParsedDocument:
    meta: dict
    source_type: str
    chunks: list[Chunk]
    pii_findings: list = field(default_factory=list)
    pii_registry: list = field(default_factory=list)


# --------------------------------------------------------------------------
# Markdown: hierarchical, heading-aware chunking
# --------------------------------------------------------------------------
_HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
_SECTION_NUM_RE = re.compile(r"^(\d+(?:\.\d+)*)\.?\s+(.*)$")


def _parse_front_matter(lines: list[str]) -> tuple[dict, int]:
    if not lines or lines[0].strip() != "---":
        return {}, 0
    meta = {}
    for i in range(1, len(lines)):
        if lines[i].strip() == "---":
            return meta, i + 1
        key, _, value = lines[i].partition(":")
        value = value.strip().strip('"').strip("'")
        meta[key.strip()] = value or None
    raise IngestionError("Unterminated front matter")


def _split_blocks(body: list[tuple[int, str]]) -> list[tuple[str, int, int, list[str]]]:
    """Group lines into structural blocks: paragraph | list | table."""
    blocks, cur, kind = [], [], None

    def flush():
        nonlocal cur, kind
        if cur:
            blocks.append((kind, cur[0][0], cur[-1][0], [l for _, l in cur]))
        cur, kind = [], None

    for ln, line in body:
        s = line.strip()
        if not s:
            flush()
            continue
        k = "table" if s.startswith("|") else "list" if re.match(r"^([-*]|\d+\.)\s", s) else "paragraph"
        if kind == "list" and k == "paragraph" and line.startswith(("  ", "\t")):
            k = "list"  # continuation of a list item
        if kind and k != kind:
            flush()
        kind = k
        cur.append((ln, line))
    flush()
    return blocks


def _words(text: str) -> int:
    return len(text.split())


def parse_markdown(path: Path, raw: str, meta_override: dict | None = None) -> ParsedDocument:
    lines = raw.splitlines()
    meta, start = _parse_front_matter(lines)
    meta.update({k: v for k, v in (meta_override or {}).items() if v})
    chunks: list[Chunk] = []
    heading_stack: list[tuple[int, str, str | None, str]] = []  # (level, text, number, title)
    body: list[tuple[int, str]] = []
    findings, registry = [], []

    def emit_section():
        nonlocal body
        if not body or not heading_stack:
            body = []
            return
        leaf = heading_stack[-1]
        path_txt = " > ".join(h[1] for h in heading_stack[1:]) or heading_stack[0][1]
        blocks = _split_blocks(body)
        group: list[tuple[str, int, int, list[str]]] = []

        def flush_group():
            if not group:
                return
            text = "\n".join("\n".join(b[3]) for b in group).strip()
            res = privacy.redact_text(text)
            findings.extend(res.findings)
            chunks.append(Chunk(
                chunk_type="section_text", content=res.text, section=leaf[2],
                section_title=leaf[3], heading_path=path_txt,
                line_start=group[0][1], line_end=group[-1][2], pii_redactions=res.count,
            ))
            group.clear()

        for block in blocks:
            kind, ls, le, blines = block
            if kind == "table":
                flush_group()
                _emit_markdown_table(block, leaf, path_txt, meta, chunks, findings)
                continue
            if group and _words(" ".join(" ".join(b[3]) for b in group + [block])) > MAX_CHUNK_WORDS:
                flush_group()
            group.append(block)
        flush_group()
        body = []

    for idx in range(start, len(lines)):
        line = lines[idx]
        ln = idx + 1
        if line.lstrip().startswith(">"):
            continue  # document notices / blockquotes are not evidence
        m = _HEADING_RE.match(line)
        if m:
            emit_section()
            level, text = len(m.group(1)), m.group(2).strip()
            num = _SECTION_NUM_RE.match(text)
            number, title = (num.group(1), num.group(2)) if num else (None, text)
            while heading_stack and heading_stack[-1][0] >= level:
                heading_stack.pop()
            heading_stack.append((level, text, number, title))
            continue
        body.append((ln, line))
    emit_section()
    return ParsedDocument(meta=meta, source_type="markdown", chunks=chunks,
                          pii_findings=findings, pii_registry=registry)


def _emit_markdown_table(block, leaf, path_txt, meta, chunks, findings):
    _, ls, _, blines = block
    rows = [[c.strip() for c in l.strip().strip("|").split("|")] for l in blines]
    rows = [r for r in rows if not all(re.fullmatch(r":?-{2,}:?", c) for c in r)]
    if len(rows) < 2:
        return
    header, data = rows[0], rows[1:]
    table_id = f"TBL-{(leaf[2] or 'X').replace('.', '-')}"
    for i, cells in enumerate(data, start=1):
        record = dict(zip(header, cells))
        safe, f, _ = privacy.redact_record(record)
        findings.extend(f)
        row_id = f"ROW-{i:02d}"
        chunks.append(Chunk(
            chunk_type="table_row", section=leaf[2], section_title=leaf[3], heading_path=path_txt,
            content=" | ".join(f"{k}: {v}" for k, v in safe.items()), line_start=ls + i + 1,
            line_end=ls + i + 1, table_id=table_id, row_id=row_id, row_cells=safe,
            row_columns=header, row_index=i, pii_redactions=len(f),
        ))


# --------------------------------------------------------------------------
# CSV: row-atomic table chunks
# --------------------------------------------------------------------------
def parse_csv(path: Path, raw: str, meta_override: dict | None = None) -> ParsedDocument:
    meta = dict(meta_override or {})
    reader = csv.DictReader(io.StringIO(raw))
    columns = reader.fieldnames or []
    if not columns:
        raise IngestionError(f"{path.name}: CSV has no header row")
    table_id = meta.get("table_id") or f"TBL-{meta.get('document_id', path.stem)}"
    row_col = meta.get("row_id_column") or ("row_id" if "row_id" in columns else None)
    chunks, findings, registry = [], [], []
    for i, row in enumerate(reader, start=1):
        safe, f, reg = privacy.redact_record(row)
        findings.extend(f)
        registry.extend(reg)
        row_id = (row.get(row_col) if row_col else None) or f"ROW-{i:02d}"
        content = " | ".join(f"{c}: {safe.get(c, '')}" for c in columns)
        chunks.append(Chunk(
            chunk_type="table_row", content=content, section=table_id,
            section_title=f"Table row {row_id}", heading_path=f"{table_id} > {row_id}",
            line_start=i + 1, line_end=i + 1, table_id=table_id, row_id=row_id,
            row_cells=safe, row_columns=columns, row_index=i, pii_redactions=len(f),
        ))
    return ParsedDocument(meta=meta, source_type="csv", chunks=chunks,
                          pii_findings=findings, pii_registry=registry)


# --------------------------------------------------------------------------
# JSON: record-atomic chunks with field-level privacy redaction
# --------------------------------------------------------------------------
def parse_json(path: Path, raw: str, meta_override: dict | None = None) -> ParsedDocument:
    data = json.loads(raw)
    meta = dict(data.get("document", {})) if isinstance(data, dict) else {}
    meta.update({k: v for k, v in (meta_override or {}).items() if v})
    records = data.get("records") if isinstance(data, dict) else data
    if not isinstance(records, list):
        raise IngestionError(f"{path.name}: expected a 'records' list")
    chunks, findings, registry = [], [], []
    for i, rec in enumerate(records, start=1):
        if not isinstance(rec, dict):
            continue
        safe, f, reg = privacy.redact_record(rec)
        findings.extend(f)
        registry.extend(reg)
        record_id = str(rec.get("record_id") or rec.get("id") or f"REC-{i:03d}")
        content = " | ".join(f"{k}: {v}" for k, v in safe.items() if v not in (None, ""))
        chunks.append(Chunk(
            chunk_type="json_record", content=content, section=record_id,
            section_title=f"Record {record_id}", heading_path=f"records > {record_id}",
            record_id=record_id, row_cells=safe, row_columns=list(safe.keys()),
            row_index=i, pii_redactions=len(f),
        ))
    return ParsedDocument(meta=meta, source_type="json", chunks=chunks,
                          pii_findings=findings, pii_registry=registry)


def _unsupported(fmt: str):
    def _p(path: Path, raw: str, meta_override=None):
        raise UnsupportedFormat(
            f"{fmt} parsing is not enabled in this build. Add a parser to ingest.PARSERS "
            "that returns a ParsedDocument; the rest of the pipeline is format-agnostic.")
    return _p


PARSERS = {
    ".md": parse_markdown,
    ".markdown": parse_markdown,
    ".csv": parse_csv,
    ".json": parse_json,
    ".pdf": _unsupported("PDF"),
    ".xlsx": _unsupported("XLSX"),
}


# --------------------------------------------------------------------------
# Validation + persistence
# --------------------------------------------------------------------------
def _validate_meta(meta: dict, path: Path) -> dict:
    missing = [k for k in ("document_id", "title", "category", "version", "status") if not meta.get(k)]
    if missing:
        raise IngestionError(f"{path.name}: missing required metadata {missing}")
    if meta["category"] not in VALID_CATEGORIES:
        raise IngestionError(f"{path.name}: unknown category {meta['category']!r}")
    if meta["status"] not in VALID_STATUSES:
        raise IngestionError(f"{path.name}: unknown status {meta['status']!r}")
    meta.setdefault("classification", "restricted" if meta["category"] == "audit_record" else "internal")
    return meta


def load_manifest(corpus_dir: Path) -> dict:
    mf = corpus_dir / "manifest.json"
    return json.loads(mf.read_text(encoding="utf-8")) if mf.exists() else {}


def parse_file(path: Path, meta_override: dict | None = None) -> ParsedDocument:
    parser = PARSERS.get(path.suffix.lower())
    if not parser:
        raise UnsupportedFormat(f"Unsupported file type: {path.suffix}")
    raw = path.read_text(encoding="utf-8")
    parsed = parser(path, raw, meta_override)
    parsed.meta = _validate_meta(parsed.meta, path)
    parsed.meta["source_file"] = path.name
    parsed.meta["content_sha256"] = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return parsed


def persist(parsed: ParsedDocument) -> dict:
    """Write one parsed document (with embeddings) to PostgreSQL."""
    meta = parsed.meta
    doc_id = meta["document_id"]
    prefix = f"{meta['title']} (v{meta['version']}, {meta['status']})"
    index_texts = [f"{prefix} | {c.heading_path or ''}\n{c.content}" for c in parsed.chunks]
    vectors = models.embed(index_texts) if index_texts else []

    with db.transaction() as conn:
        conn.execute(
            """INSERT INTO documents (document_id, title, category, source_type, source_file,
                   department, classification, current_version, status)
               VALUES (%(document_id)s, %(title)s, %(category)s, %(source_type)s, %(source_file)s,
                   %(department)s, %(classification)s, %(version)s, %(status)s)
               ON CONFLICT (document_id) DO UPDATE SET title = EXCLUDED.title,
                   category = EXCLUDED.category, source_type = EXCLUDED.source_type,
                   source_file = EXCLUDED.source_file, department = EXCLUDED.department,
                   classification = EXCLUDED.classification,
                   current_version = EXCLUDED.current_version, status = EXCLUDED.status,
                   updated_at = now()""",
            {**{k: meta.get(k) for k in DOC_META_KEYS}, "source_type": parsed.source_type,
             "source_file": meta["source_file"]},
        )
        # Older versions of the same document become superseded (lifecycle).
        conn.execute(
            """UPDATE document_versions SET status = 'superseded', superseded_by = %s
               WHERE document_id = %s AND version <> %s AND status = 'active'""",
            (doc_id, doc_id, meta["version"]),
        )
        conn.execute(
            """INSERT INTO document_versions (document_id, version, status, effective_from,
                   effective_to, supersedes, superseded_by, content_sha256, metadata)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
               ON CONFLICT (document_id, version) DO UPDATE SET status = EXCLUDED.status,
                   effective_from = EXCLUDED.effective_from, effective_to = EXCLUDED.effective_to,
                   supersedes = EXCLUDED.supersedes, superseded_by = EXCLUDED.superseded_by,
                   content_sha256 = EXCLUDED.content_sha256, metadata = EXCLUDED.metadata,
                   ingested_at = now()""",
            (doc_id, meta["version"], meta["status"], meta.get("effective_from"),
             meta.get("effective_to"), meta.get("supersedes"), meta.get("superseded_by"),
             meta["content_sha256"], db.jsonb({k: v for k, v in meta.items()})),
        )
        # A document that declares `supersedes` retires its predecessor.
        if meta.get("supersedes") and meta["status"] == "active":
            conn.execute(
                "UPDATE documents SET status = 'superseded', updated_at = now() WHERE document_id = %s",
                (meta["supersedes"],),
            )
            conn.execute(
                """UPDATE document_versions SET status = 'superseded', superseded_by = %s
                   WHERE document_id = %s""",
                (doc_id, meta["supersedes"]),
            )
        rbac.materialise_document_permissions(conn, doc_id, meta["category"])
        conn.execute("DELETE FROM chunks WHERE document_id = %s", (doc_id,))
        for i, (c, text, vec) in enumerate(zip(parsed.chunks, index_texts, vectors), start=1):
            chunk_id = f"{doc_id}#CHK-{i:04d}"
            conn.execute(
                """INSERT INTO chunks (chunk_id, document_id, version, chunk_index, chunk_type,
                       section, section_title, heading_path, line_start, line_end, table_id,
                       row_id, record_id, content, index_text, embedding, pii_redactions)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
                (chunk_id, doc_id, meta["version"], i, c.chunk_type, c.section, c.section_title,
                 c.heading_path, c.line_start, c.line_end, c.table_id, c.row_id, c.record_id,
                 c.content, text, [float(x) for x in vec], c.pii_redactions),
            )
            if c.chunk_type == "table_row":
                conn.execute(
                    """INSERT INTO table_rows (chunk_id, document_id, version, table_id, row_id,
                           row_index, columns, cells) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
                    (chunk_id, doc_id, meta["version"], c.table_id, c.row_id, c.row_index,
                     db.jsonb(c.row_columns), db.jsonb(c.row_cells)),
                )
        for value_hash, pii_type, ntok in parsed.pii_registry:
            conn.execute(
                """INSERT INTO pii_registry (value_hash, pii_type, document_id, token_count)
                   VALUES (%s,%s,%s,%s) ON CONFLICT (value_hash) DO NOTHING""",
                (value_hash, pii_type, doc_id, ntok),
            )
    by_type: dict[str, int] = {}
    for f in parsed.pii_findings:
        by_type[f.pii_type] = by_type.get(f.pii_type, 0) + 1
    return {
        "document_id": doc_id, "title": meta["title"], "version": meta["version"],
        "status": meta["status"], "category": meta["category"], "source_type": parsed.source_type,
        "chunks": len(parsed.chunks),
        "table_rows": sum(1 for c in parsed.chunks if c.chunk_type == "table_row"),
        "records": sum(1 for c in parsed.chunks if c.chunk_type == "json_record"),
        "pii_redactions": len(parsed.pii_findings), "pii_by_type": by_type,
    }


def ingest_path(path: Path, meta_override: dict | None = None) -> dict:
    return persist(parse_file(path, meta_override))


def ingest_corpus(corpus_dir: Path | None = None) -> list[dict]:
    corpus_dir = corpus_dir or settings.corpus_dir
    manifest = load_manifest(corpus_dir)
    results = []
    files = sorted(p for p in corpus_dir.iterdir()
                   if p.suffix.lower() in PARSERS and p.name not in ("manifest.json", "eval_questions.json"))
    for path in files:
        results.append(ingest_path(path, manifest.get(path.name)))
    return results


def bootstrap(force: bool = False) -> list[dict]:
    db.init_schema()
    rbac.seed_roles()
    count = db.fetch_one("SELECT count(*) AS n FROM chunks")["n"]
    if count and not force:
        return []
    return ingest_corpus()


if __name__ == "__main__":
    force = "--force" in sys.argv
    db.init_schema()
    rbac.seed_roles()
    for r in ingest_corpus():
        print(json.dumps(r))
