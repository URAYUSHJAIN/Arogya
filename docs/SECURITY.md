# Security & Privacy

## RBAC (R6 / A4)

Role policy (`rag-pipeline/rbac.py`, seeded into `roles` / `permissions`):

| Role | Guidelines | SOPs | Formulary | Payer Policies | Device Manuals | Restricted Audit Records |
|---|---|---|---|---|---|---|
| Physician | ✓ | ✓ | ✓ | ✓ | ✓ | |
| Nurse | ✓ | ✓ | ✓ | | ✓ | |
| Pharmacist | ✓ | | ✓ | ✓ | | |
| Billing Specialist | | | ✓ | ✓ | | |
| Compliance Auditor | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Enforcement points (all server-side):

1. `rbac.build_user_context(role)` rejects unknown roles (HTTP 403) and loads grants from PostgreSQL.
2. `HybridIndex.authorized_indices` removes unauthorized chunks **before** BM25/dense/RRF/rerank.
3. `rbac.assert_authorized` is called on the selected context in `pipeline.run_query` and again
   inside `synthesizer.synthesize` before the prompt is built (raises on violation).
4. `/api/evidence/{id}` and `/api/documents/{id}` re-check authorization for every citation click.

The frontend role selector only chooses which role is *claimed*; the backend decides access.
There is no authentication system (synthetic users) — a production deployment would bind the
role to an identity provider token. This is a stated limitation.

## Privacy gate (R7)

`rag-pipeline/privacy.py` runs at four points:

| Point | What happens |
|---|---|
| Ingestion | Structured PII fields (`patient_name`, `mrn`, `dob`, `phone`, `email`, `address`) are replaced by `[REDACTED-<TYPE>]`; free text is regex-scanned. SHA-256 hashes of removed values (and name tokens, street part, phone digits) go to `pii_registry`. Raw identifiers never enter `chunks`, embeddings or BM25. |
| Query | The query is scanned; the audit log stores the redacted form. |
| Model input | Every evidence passage is re-scanned in `synthesizer.build_prompt`. |
| Output | `privacy.output_gate` applies regex redaction and n-gram hash matching against `pii_registry`; any hit is replaced with `[REDACTED-ID]`. `contains_leak` independently re-checks the delivered answer. |

Leakage is measured, not asserted: the evaluator scans the **entire JSON payload** of every
benchmark response. The header's "PII Guard" value is read from `audit_events`.

This is deterministic pattern + registry protection tuned to the synthetic corpus; it is not
a certified de-identification system.

## Secrets

* `rag-pipeline/.env` (git-ignored) holds `DATABASE_URL`. `.env.example` has placeholders only.
* No model API key exists anywhere: all models run locally. The frontend has no secrets and
  only calls `/api/*`. The old client-side Gemini integration was removed.
* `OllamaProvider` refuses non-localhost URLs.
