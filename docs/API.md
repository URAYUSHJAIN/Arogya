# API (FastAPI, `rag-pipeline/server.py`, default `http://127.0.0.1:8010`)

Roles: `Physician`, `Nurse`, `Pharmacist`, `Billing Specialist`, `Compliance Auditor`.
An unknown role returns **403**.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | DB status, index size, model load state, generation provider health |
| GET | `/api/roles` | Role policy (categories per role) |
| GET | `/api/documents?role=` | Corpus catalogue metadata; `accessible` is computed server-side for `role`; `total`, `active` counts |
| GET | `/api/documents/{document_id}?role=` | Versions, chunks and table rows of one document (403 if not authorized) |
| GET | `/api/evidence/{chunk_id}?role=` | Resolve a citation: passage, lifecycle, table + row, sibling chunks (403 if not authorized) |
| POST | `/api/query` | Run the full pipeline |
| POST | `/api/ingest` | Multipart upload (`file` + optional `document_id,title,category,version,status,department,supersedes,effective_from`) of `.md/.csv/.json` through the real ingestion pipeline |
| POST | `/api/evaluate` | Run the 15-question benchmark now; returns the full report |
| GET | `/api/evaluation/latest` | Latest persisted run with per-question results |
| GET | `/api/privacy/status` | Leak / redaction counters from `audit_events` and `chunks` |
| GET | `/api/audit?limit=` | Recent audit events |
| POST | `/api/audit/events` | Record a UI event (e.g. citation opened); details are PII-scanned |

## POST /api/query

Request:
```json
{"query": "What is the recommended adult sepsis vancomycin regimen?", "role": "Physician"}
```

Response (abridged):
```json
{
  "trace_id": "uuid",
  "status": "answered | answered_with_conflict | refused | generation_unavailable",
  "role": "Physician",
  "query": "<query after PII redaction>",
  "answer": "… [1].",
  "claims": [{"text": "...", "citations": [1], "support": 0.93, "auto_attributed": false,
              "invalid_citations": [], "unsupported_numbers": []}],
  "citations": [{"ref": 1, "chunk_id": "DOC-SEP-2025#CHK-0011", "document_id": "DOC-SEP-2025",
                 "version": "4.2", "status": "active", "section": "4.2", "row_id": null, "...": "..."}],
  "conflicts": [{"subject": "vancomycin", "kind": "regimen",
                 "sources": [{"document_id": "...", "values": ["15 mg/kg q12h"], "claim_text": "...",
                              "evidence_ref": 1, "lifecycle": {"status": "active", "is_current": true, "...": "..."}}],
                 "assessment": {"summary": "...", "resolution": "lifecycle_precedence_suggested", "lifecycle_notes": []}}],
  "lifecycle_warning": null,
  "refusal": null,
  "sufficiency": {"sufficient": true, "reason": "sufficient", "top_rerank_score": 0.97, "coverage": 1.0,
                  "missing_terms": [], "inaccessible_categories": ["Restricted Audit Records"]},
  "evidence": [{"ref": 1, "chunk_id": "...", "content": "...", "retrieval": {"sources": ["bm25","dense"],
                "bm25_score": 9.1, "bm25_rank": 1, "dense_score": 0.61, "dense_rank": 2,
                "rrf_score": 0.0325, "rerank_score": 0.97}, "lifecycle": {"...": "..."}}],
  "retrieval": {"total_chunks": 80, "authorized_chunks": 74, "excluded_by_acl": 6, "context_chunks": 6,
                "authorized_documents": ["..."]},
  "generation": {"provider": "transformers", "model": "Qwen/Qwen2.5-0.5B-Instruct", "mode": "transformers",
                 "fallback_reason": null, "model_input_redactions": 0},
  "verification": {"removed_claims": [], "total_draft_claims": 2, "draft_groundedness": 1.0},
  "privacy": {"query_identifiers_redacted": 0, "output_identifiers_blocked": 0,
              "leak_detected_in_delivered_answer": false},
  "latency_ms": 9000
}
```

A refusal has `answer: null` and `refusal: {reason, message, missing_terms, searched_documents,
closest_evidence, escalation}`.
