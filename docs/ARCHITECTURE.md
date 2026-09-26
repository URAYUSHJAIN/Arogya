# Architecture

Arogya is a two-process system: a **FastAPI backend** (`rag-pipeline/`) that owns every
security, retrieval and generation decision, and a **React/Vite frontend** (`frontend/`)
that only renders what the backend returns. PostgreSQL is the source of truth.

```
Browser (React)  ──REST /api/*──►  FastAPI (server.py)
                                        │
             ┌──────────────────────────┼─────────────────────────────┐
             ▼                          ▼                             ▼
      ingest.py (parse →         pipeline.run_query              evaluator.py
      privacy → chunk →               │                          (15 questions through
      embed → persist)                ▼                           run_query → metrics)
             │                 rbac.build_user_context  ◄── PostgreSQL grants
             ▼                        │
        PostgreSQL ──load──► retriever.HybridIndex
                                      │  pre-retrieval ACL (authorized chunk indices only)
                                      │  BM25 (rank_bm25) + dense (MiniLM) → RRF
                                      │  cross-encoder rerank (bge-reranker-base)
                                      ▼
                          conflict_and_lifecycle.detect_conflicts / partition_by_lifecycle
                                      ▼
                          sufficiency.assess  ──insufficient──► refusal (no generation)
                                      ▼ sufficient
                          synthesizer.synthesize (assert_authorized → local LLM)
                                      ▼
                          claim/citation verification → privacy.output_gate
                                      ▼
                          audit_events row → JSON response
```

## Modules (`rag-pipeline/`)

| Module | Responsibility |
|---|---|
| `config.py` | Environment configuration (`.env`), thresholds, model names |
| `database.py` | PostgreSQL schema (auto-migrated on startup), connection helpers |
| `rbac.py` | Role policy seed, ACL materialisation, `UserContext`, `assert_authorized` |
| `privacy.py` | PII/PHI detection, redaction, identifier-hash registry, output gate |
| `ingest.py` | Markdown / CSV / JSON parsers, hierarchical & row/record-atomic chunking, persistence |
| `models.py` | Process-wide loaders for the embedding model and cross-encoder |
| `retriever.py` | In-memory hybrid index built from PostgreSQL; ACL → BM25 + dense → RRF → rerank |
| `conflict_and_lifecycle.py` | Claim extraction, cross-document conflict detection, lifecycle state |
| `sufficiency.py` | Evidence sufficiency gate + refusal message |
| `generation.py` | `GenerationProvider` interface: `transformers` (default), `ollama` (localhost only), `extractive` |
| `synthesizer.py` | Prompt construction (model-input privacy scan), generation, claim verification |
| `pipeline.py` | Orchestration, output privacy gate, audit logging |
| `evaluator.py` | Benchmark runner and metric computation |
| `server.py` | REST API |

## Key design decisions

* **Authorization before scoring.** `HybridIndex.authorized_indices(ctx)` restricts the
  candidate set before BM25, dense search, fusion or reranking run. Unauthorized chunks
  are never scored. `rbac.assert_authorized` re-checks immediately before the prompt is built.
* **Evidence before generation.** The sufficiency gate runs before the generator is called;
  refused questions never reach the model.
* **Citations are verified, not trusted.** The generator is asked to cite `[n]`, but every
  sentence is checked by code against the cited passage (content overlap + every number must
  appear in the passage). Unverifiable sentences are removed and shown as removed.
* **Conflicts are data-driven.** Regimen `(dose, frequency)` and timing `within N hours` claims
  are extracted from retrieved passages; medication vocabulary comes from the ingested
  formulary table. Disjoint values across documents = conflict.
* **Lifecycle-aware answering.** Superseded/retired evidence is excluded from the answer
  context but kept in the conflict card with its lifecycle label.
* **Local-only generation.** No cloud provider exists in code. Default is
  `Qwen/Qwen2.5-0.5B-Instruct` on CPU via `transformers`. If its draft fails verification the
  response declares `mode: extractive_fallback` — a local, visible, labelled fallback.
* **pgvector not required.** Embeddings are stored as `DOUBLE PRECISION[]` in `chunks.embedding`
  and loaded into a NumPy matrix at startup (corpus is small; PostgreSQL remains the source of truth).
