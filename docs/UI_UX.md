# UI / UX

Exactly three routes (`frontend/src/main.jsx`):

| Route | Page | Purpose |
|---|---|---|
| `/` | `HomePage.jsx` | What Arogya is, the P-02 problem, the pipeline stages, CTA **Open Clinical Auditor** |
| `/ai-analysis` | `AIAnalysisPage.jsx` | Enterprise 3-pane Clinical Auditor Workspace |
| `/emergency` | `EmergencyPage.jsx` | Audit, Groundedness & Evaluation Dashboard |

## Header (all pages)

* **Role selector** – five roles; changing role re-queries `/api/documents?role=` and every
  subsequent `/api/query` carries the new role. The backend validates and enforces it.
* **PII Guard** – `leaks_in_delivered_answers / queries_scanned` from `/api/privacy/status`
  (computed from `audit_events`); tooltip shows blocked and ingestion-redaction counts.
* **Docs** – `active / total` from `/api/documents`.

## Clinical Auditor Workspace

* **Left (~20%) Corpus & Ingest** – every document with version, lifecycle status, category,
  restricted flag, row/chunk counts, PII-redaction count, supersession links and an
  ACCESS/LOCKED badge computed server-side for the current role. **+ Ingest Doc** uploads a
  file to `/api/ingest` (real parse → redact → chunk → embed → persist → index reload).
* **Centre (~50%) Interrogate** – question box, quick-query pills (they only fill the input),
  pipeline progress state, status badge (grounded / conflict / refused), answer sentences with
  clickable citation chips and per-claim support %, removed-sentence disclosure, conflict card
  (Source A/B, values, lifecycle labels, assessment), refusal card (reason, missing terms,
  searched documents, escalation), citation list, and a collapsible retrieval trace table
  (BM25 rank, dense rank, RRF, rerank per chunk).
* **Right (~30%) Trace Inspector** – opens the clicked citation via `/api/evidence/{chunk}`:
  metadata + scores, and either the full document with the cited passage highlighted (amber,
  auto-scrolled) or the full table rendered with TanStack Table and the cited row highlighted.
  Opening a citation records a `ui_citation_opened` audit event.

## Evaluation Dashboard

**Run Live Benchmark Suite (15 Queries)** → `POST /api/evaluate`. Shows run id, timestamp,
duration, passed/failed, generator used, six metric tiles, category breakdown, and a
per-question table listing every check with its pass/fail detail. Below: recent audit events.

## Reused visual foundation

Palette (`--ap-*` greens/cream), DM Sans + Playfair Display typography, rounded cards, and
`PillLoader` come from the earlier ArogyaPlus frontend. All consumer features (doctors, blog,
hospital map, testimonials, report upload, Gemini calls) were removed.
