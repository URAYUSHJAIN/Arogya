# Data Model (PostgreSQL)

The schema lives in `rag-pipeline/database.py` (`SCHEMA_SQL`) and is applied idempotently by
`database.init_schema()` on every backend start (`CREATE TABLE IF NOT EXISTS`). If the
`arogya_rag` database does not exist, `database.ensure_database()` creates it.

| Table | Purpose | Key columns |
|---|---|---|
| `roles` | The five synthetic roles | `id uuid`, `name`, `description` |
| `permissions` | Role → document **category** grant | `role_id`, `category` |
| `documents` | One row per logical document | `document_id`, `title`, `category`, `source_type`, `source_file`, `department`, `classification`, `current_version`, `status` |
| `document_versions` | Version history + lifecycle | `document_id`, `version`, `status`, `effective_from`, `effective_to`, `supersedes`, `superseded_by`, `content_sha256`, `metadata jsonb` |
| `document_permissions` | Materialised ACL (document → role), derived at ingestion from `permissions` | `document_id`, `role_id` |
| `chunks` | Retrieval units with provenance | `chunk_id` (`DOC-ID#CHK-0001`), `document_id`, `version`, `chunk_type` (`section_text`/`table_row`/`json_record`), `section`, `section_title`, `heading_path`, `line_start`, `line_end`, `table_id`, `row_id`, `record_id`, `content` (redacted passage), `index_text` (contextual header + passage), `embedding double precision[]`, `pii_redactions` |
| `table_rows` | Row-atomic table evidence | `chunk_id`, `document_id`, `version`, `table_id`, `row_id`, `row_index`, `columns jsonb`, `cells jsonb` |
| `pii_registry` | SHA-256 hashes (never raw values) of identifiers removed at ingestion | `value_hash`, `pii_type`, `document_id`, `token_count` |
| `audit_events` | One row per query / ingestion / UI event | `event_type`, `role`, `query_redacted`, `status`, `authorized_document_ids[]`, `retrieved_document_ids[]`, `context_chunk_ids[]`, `citation_ids[]`, `conflict_detected`, `sufficiency jsonb`, `privacy jsonb`, `details jsonb` |
| `evaluation_questions` | Benchmark questions synced from `corpus/eval_questions.json` | `id`, `category`, `role`, `question`, `expected jsonb` |
| `evaluation_runs` | One row per benchmark execution | `started_at`, `finished_at`, `total_questions`, `completed_questions`, `passed`, `metrics jsonb`, `config jsonb` |
| `evaluation_results` | Per-question outcome | `run_id`, `question_id`, `passed`, `status`, `checks jsonb`, `details jsonb` |

## Provenance chain

`citation.ref → chunks.chunk_id → documents.document_id + chunks.version → document_versions`
plus `section / heading_path / line_start–line_end` for Markdown, `table_id / row_id → table_rows`
for CSV, and `record_id` for JSON.

## Lifecycle rules implemented in `ingest.persist`

* Re-ingesting a document with a new version marks older `document_versions` rows `superseded`.
* An **active** document that declares `supersedes: X` marks document `X` and its versions
  `superseded` with `superseded_by` set.
* Chunks are replaced on re-ingestion; version history is retained.
