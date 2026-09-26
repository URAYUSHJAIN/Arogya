# AGENTS.md — P-02 Healthcare Greenfield Enterprise RAG

> **For all AI coding agents working on this repository.**
>
> This file provides the operational rules, architecture contract,
> and development constraints for the P-02 project.
>
> Read `CLAUDE.md` for the complete requirements summary.
> Read `context/problem.md` for the authoritative problem statement.
> Read `context/ESCAPE_VELOCITY_CONTEXT.md` for the full hackathon context.

---

## 1. What This Project Is

An **enterprise retrieval-augmented generation (RAG) system** for a
healthcare organization starting from zero.

It is **NOT**:
- A healthcare chatbot
- A medical report analyzer
- A consumer health app
- A UI mockup of an enterprise system

It **IS**:
- A real ingestion → retrieval → grounding → citation → refusal pipeline
- With server-side RBAC inside the retrieval path
- With conflict detection between contradicting sources
- With precise passage-level citations
- With measurable evaluation on a defined question set
- Using synthetic/de-identified data only

---

## 2. Before You Write Any Code

### Mandatory reading (in this order):

1. `context/problem.md` — the authoritative P-02 requirements
2. `context/ESCAPE_VELOCITY_CONTEXT.md` — full hackathon context, rules, rubric
3. `CLAUDE.md` — summarized rules, architecture, RBAC model

### Mandatory understanding:

Before modifying any file, you must be able to answer:

1. Which P-02 requirement does this change serve? (R1–R8, A1–A6)
2. What failure mode does it address?
3. Does it maintain all security invariants?
4. How will it be tested?
5. How can a reviewer verify it works?

---

## 3. Architecture Contract

### System Components

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INGESTION LAYER                              │
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐                        │
│  │  Parser Engine   │───▶│   PII/PHI Gate   │                       │
│  │                 │    │                 │                        │
│  │  PDF/MD/CSV/    │    │  Detect/redact  │                        │
│  │  JSON/XLSX      │    │  synthetic IDs  │                        │
│  │  → chunks +     │    │  before storage │                        │
│  │    metadata     │    │                 │                        │
│  └─────────────────┘    └────────┬────────┘                        │
│                                  │                                  │
│                          Chunks + Metadata                          │
│                                  │                                  │
│                     ┌────────────▼────────────┐                     │
│                     │    Index (BM25 + Dense)  │                    │
│                     └─────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                        RETRIEVAL LAYER                              │
│                                                                     │
│  User Question                                                      │
│       │                                                             │
│       ▼                                                             │
│  ┌──────────┐  ┌──────────┐                                        │
│  │  BM25    │  │  Dense   │   ← Hybrid retrieval (A1)              │
│  │ (lexical)│  │(semantic)│                                        │
│  └────┬─────┘  └────┬─────┘                                        │
│       └──────┬───────┘                                              │
│              ▼                                                      │
│       ┌──────────┐                                                  │
│       │  Fusion  │                                                  │
│       └────┬─────┘                                                  │
│            ▼                                                        │
│       ┌──────────┐                                                  │
│       │ Reranker │                                                  │
│       └────┬─────┘                                                  │
│            ▼                                                        │
│  ┌─────────────────┐                                                │
│  │   RBAC Filter   │  ← R6: filter by user role + allowed_roles    │
│  │  (server-side)  │     BEFORE evidence reaches model             │
│  └────────┬────────┘                                                │
│           │                                                         │
│     Authorized evidence only                                        │
└───────────┬─────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────┐
│                        REASONING LAYER                              │
│                                                                     │
│  ┌─────────────────┐                                                │
│  │    Conflict      │  ← R4: detect disagreements between sources  │
│  │    Resolver      │     check version/status metadata            │
│  │                 │     surface both sides to user               │
│  └────────┬────────┘                                                │
│           │                                                         │
│     Evidence + conflict metadata                                    │
└───────────┬─────────────────────────────────────────────────────────┘
            │
┌───────────▼─────────────────────────────────────────────────────────┐
│                     GENERATION & EVALUATION                         │
│                                                                     │
│  ┌─────────────────┐    ┌─────────────────┐                        │
│  │    Grounded      │    │   Audit & Eval  │                        │
│  │    Synthesis     │    │                 │                        │
│  │                 │    │  Query log      │                        │
│  │  Sufficient?    │    │  Retrieval log  │                        │
│  │  ├── Yes:       │    │  Response log   │                        │
│  │  │   answer +   │    │  Eval questions │                        │
│  │  │   citations  │    │  Measured scores│                        │
│  │  ├── Conflict:  │    │                 │                        │
│  │  │   surface    │    │                 │                        │
│  │  └── No:        │    │                 │                        │
│  │      refuse +   │    │                 │                        │
│  │      explain    │    │                 │                        │
│  └─────────────────┘    └─────────────────┘                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Invariant

```
User Question
     ↓
Authenticate (identify role)
     ↓
Retrieve (BM25 + Dense → Fusion → Rerank)
     ↓
RBAC Filter (remove unauthorized chunks — SERVER SIDE)
     ↓
Conflict Analysis (detect disagreements)
     ↓
Evidence Sufficiency Check
     ├── Sufficient: Grounded Answer + Citations
     ├── Conflict: Surface Conflict + Show Both Sources
     └── Insufficient: Refuse + State Missing Evidence
     ↓
PII Output Scan
     ↓
Audit Log
     ↓
Response to User
```

---

## 4. RBAC Model

### Roles

| Role | Accessible Document Types |
|---|---|
| `doctor` | clinical_guidelines, sops, formulary, device_manuals, operational |
| `nurse` | sops, formulary, device_manuals |
| `admin` | operational, payer_policies, sops |
| `pharmacist` | formulary, clinical_guidelines |
| `billing` | payer_policies, operational |

### Document Metadata

Every document MUST have:

```json
{
  "document_id": "unique-id",
  "document_type": "clinical_guideline | policy | formulary | device_manual | operational | payer_policy",
  "title": "Human readable title",
  "version": "2026-v2",
  "status": "active | superseded | retired | draft",
  "effective_from": "2026-01-15",
  "effective_to": null,
  "supersedes": "document-id-of-previous-version or null",
  "department": "cardiology | general | pharmacy | billing | ...",
  "allowed_roles": ["doctor", "nurse", "admin"],
  "source_file": "filename.pdf"
}
```

### Chunk Metadata

Every chunk inherits from its parent document plus:

```json
{
  "chunk_id": "unique-chunk-id",
  "document_id": "parent-document-id",
  "page": 14,
  "section": "3.2",
  "section_title": "Anticoagulation Protocol",
  "chunk_type": "text | table | header",
  "table_id": null,
  "row_id": null,
  "content": "the actual text content",
  "allowed_roles": ["doctor", "nurse"]
}
```

### Enforcement Rules

1. Chunks are filtered by `allowed_roles` BEFORE being sent to the LLM
2. The filter runs on the backend, not the frontend
3. If no chunks pass the filter, the response is "insufficient evidence" — never hallucinate
4. The LLM context window never contains unauthorized evidence

---

## 5. Security Invariants (MUST NEVER BE VIOLATED)

| # | Invariant |
|---|---|
| S1 | Unauthorized chunks never reach the LLM context |
| S2 | RBAC is enforced server-side, not in the browser |
| S3 | API keys/tokens are never in client-side JavaScript |
| S4 | No real patient data anywhere in the repository |
| S5 | PII/PHI identifiers are scanned at output |
| S6 | The frontend cannot override retrieval permissions |

---

## 6. Anti-Reskinning Rule

The hackathon explicitly disallows reskinning an existing project.

The existing ArogyaPlus frontend is a **consumer health app** (blood report OCR, emergency hospital finder). That is NOT a P-02 implementation.

What must be built new:
- Complete Python backend with RAG pipeline
- Synthetic clinical corpus
- Ingestion/parsing/chunking pipeline
- BM25 + dense hybrid retrieval
- Server-side RBAC filter
- Conflict detection
- Grounded synthesis with citations
- Refusal logic
- Evaluation pipeline
- RAG-specific frontend pages (query UI, citation viewer, conflict display, RBAC demo)

What may be reused from ArogyaPlus:
- Vite/React shell (router, layout)
- TailwindCSS configuration
- Build tooling

The README must transparently declare what is reused vs. new.

---

## 7. Development Rules

### Rule 1 — Read the problem first
Read `context/problem.md` and `context/ESCAPE_VELOCITY_CONTEXT.md` before implementing.

### Rule 2 — Inspect before modifying
Before changing any module: inspect it, understand its dependencies, identify affected requirements.

### Rule 3 — Do not fake functionality
Never create: hardcoded answers, fake citations, fake retrieval, fake metrics, fake security, fake confidence.

### Rule 4 — No unsupported claims
Do not claim "This satisfies P-02" unless the behavior is actually implemented and verified.

### Rule 5 — Tests are evidence
Important requirements should have tests:
- `test_unauthorized_document_is_not_retrieved`
- `test_conflict_is_detected`
- `test_unanswerable_question_is_refused`
- `test_citation_points_to_correct_evidence`
- `test_identifier_does_not_leak`

### Rule 6 — Security before UI
Security must not depend on frontend visibility.

### Rule 7 — Preserve provenance
Every retrieved unit retains metadata for citation.

### Rule 8 — No silent conflict resolution
Do not make conflicting sources appear consistent.

### Rule 9 — No real patient data
Only synthetic/de-identified data.

### Rule 10 — Keep the system demonstrable
Every major feature must be usable in a live demo.

---

## 8. Evaluation Requirements

### Question Set Categories

| Category | Purpose | Example |
|---|---|---|
| Normal questions | Basic retrieval + answer | "What is the anticoagulation protocol?" |
| Multi-document questions | Cross-document retrieval | "How do cardiology and pharmacy policies interact for warfarin?" |
| Conflict questions | Conflict detection | "What is the fasting protocol?" (two docs disagree) |
| Unanswerable questions | Refusal behavior | "What is the policy on gene therapy?" (not in corpus) |
| Access-control questions | RBAC verification | Same question, different roles → different evidence |
| Citation questions | Citation accuracy | Verify cited source matches the claim |

### Metrics

| Metric | What It Measures |
|---|---|
| Retrieval recall@K | Correct evidence in top-K results |
| Citation correctness | Cited source actually supports the claim |
| Refusal rate | Correct refusal on unanswerable questions |
| Unauthorized retrieval rate | Unauthorized chunks that leaked through (must be 0%) |
| Groundedness | Claims supported by retrieved evidence |

**Rule: Never report a metric unless the repository contains the evaluation data and method used to calculate it.**

---

## 9. Demo Scenarios

The demo must cover these scenarios on unseen judge input:

| # | Scenario | Expected Behavior |
|---|---|---|
| 1 | Normal question | Retrieve evidence → answer → cite source |
| 2 | Citation inspection | Click citation → see document, page, section |
| 3 | Conflict question | ⚠ Conflict detected → show both sources → show version/status |
| 4 | Unanswerable question | Refuse → state missing evidence → no hallucination |
| 5 | Access control | Two users, different roles → different evidence access |
| 6 | Table retrieval | Answer from table → cite table, row, column |
| 7 | Evaluation results | Show actual benchmark scores |

---

## 10. Technology Decisions

### Backend
- **Language:** Python 3.11+
- **Framework:** FastAPI
- **Vector store:** ChromaDB (or equivalent in-memory/file-based)
- **BM25:** rank_bm25 library
- **Embeddings:** Sentence-transformers or API-based
- **LLM:** Gemini API / HuggingFace Inference API
- **Reranker:** Cross-encoder or Cohere rerank

### Frontend
- **Framework:** React 19 + Vite 7 (existing shell)
- **Styling:** TailwindCSS v4 (existing configuration)
- **State:** React hooks + context

### Corpus
- **Format:** Synthetic Markdown/PDF/CSV/JSON documents
- **Subject:** Healthcare organization (guidelines, SOPs, formulary, payer policies, device manuals)
- **Labels:** Explicitly marked as "SYNTHETIC DATA — FOR DEMONSTRATION ONLY"

---

## 11. File Ownership

| Path | Owner | Purpose |
|---|---|---|
| `context/` | Problem statement | DO NOT MODIFY |
| `CLAUDE.md` | AI instructions | Update if architecture changes |
| `AGENTS.md` | AI instructions | Update if architecture changes |
| `README.md` | Project documentation | Must be substantive before submission |
| `backend/` | RAG pipeline | All server-side logic |
| `frontend/` | UI | RAG interface + reused shell |
| `corpus/` | Synthetic data | Clinical documents for demo |
| `evaluation/` | Quality measurement | Question sets + results |
| `docs/` | Architecture docs | Supplementary documentation |

---

## 12. Coordination Rules

When multiple agents or tools work on this repository:

1. **Do not create duplicate implementations** — check what exists before adding
2. **Do not delete existing context files** — `context/` is read-only
3. **Do not modify `CLAUDE.md` or `AGENTS.md`** without explicit user instruction
4. **Keep `README.md` accurate** — update it when major features are added
5. **Run tests before declaring completion** — every claim must be verified
6. **Log your changes** — maintain a clear commit history

---

## 13. Final Verification Question

Before submission, every agent should be able to answer YES to:

> **Can a judge type a question the system has never seen, and can the
> system retrieve authorized evidence, produce a grounded answer with
> exact citations, surface conflicts, refuse unsupported questions, and
> demonstrate the behavior from the submitted code?**

If the answer is not demonstrably YES, the implementation is not finished.
