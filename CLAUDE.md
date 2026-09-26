# CLAUDE.md — P-02 Healthcare Greenfield Enterprise RAG

> **Read this file before writing any code.**
>
> This file is the primary instruction set for Claude Code and any
> Claude-based assistant working on this repository.
>
> Authoritative requirements live in `context/problem.md` and
> `context/ESCAPE_VELOCITY_CONTEXT.md`. This file summarizes the rules
> that must govern every code change.

---

## Project Identity

- **Event:** Escape Velocity Hackathon 1.0 (Velloe / EVOCS)
- **Track:** P-02 — Healthcare Greenfield Enterprise RAG
- **Date:** Saturday, September 26, 2026
- **Build window:** 09:00 – 18:00 IST
- **Submission deadline:** 15:30 IST (hard, disqualifying if missed)
- **Format:** Solo build
- **Core principle:** _A confident wrong answer is more expensive than no answer at all._

---

## Source-of-Truth Priority

When information conflicts, use this order:

1. Official event rules / organizer instructions
2. Assigned P-02 problem statement (`context/problem.md`)
3. Master context (`context/ESCAPE_VELOCITY_CONTEXT.md`)
4. This file (`CLAUDE.md`) and `AGENTS.md`
5. Project documentation
6. AI inference / implementation preference

Never override an explicit requirement with an assumption.

---

## Scoring Rubric

| Criterion | Weight | Meaning |
|---|---|---|
| Working demo | **30%** | Runs on judge's unseen input |
| Problem fit | **20%** | Solves P-02, not a nearby problem |
| Technical depth | **20%** | Hard part is genuinely solved, not stubbed |
| Originality | **15%** | Engineering approach, not visual gimmicks |
| Communication | **15%** | 3 minutes, clear, no hand-waving |

---

## Core Requirements (MUST implement)

| ID | Requirement | Summary |
|---|---|---|
| **R1** | Heterogeneous corpus | Ingest long guidelines, short policies, structured records, table-heavy sources |
| **R2** | Natural-language QA | Answer from retrieved evidence, not model knowledge |
| **R3** | Claim-level traceability | Every claim traceable to source passage; one-click access |
| **R4** | Conflict handling | Detect + surface disagreements; never silently pick one |
| **R5** | Insufficient evidence / refusal | Refuse or escalate; state what evidence is missing |
| **R6** | Retrieval-level access boundaries | RBAC inside retrieval path, not UI-only |
| **R7** | Synthetic / de-identified data | No real patient data; demonstrate leakage protection |
| **R8** | Quality measurement | Defined question set; reproducible metrics from actual runs |

## Advanced Directions (SHOULD implement)

| ID | Requirement |
|---|---|
| **A1** | Hybrid retrieval (lexical + dense + reranking) |
| **A2** | Clinical document chunking (tables, long docs, ~200pp) |
| **A3** | Fine-grained citations (passage / row / clause) |
| **A4** | Role / document-level authorization inside retrieval |
| **A5** | Groundedness / hallucination evaluation with measured score |
| **A6** | Document lifecycle (versioning, supersession, retirement) |

---

## Target Architecture

```
INGESTION                    RETRIEVAL                    REASONING                   GEN & EVAL
┌──────────────┐            ┌──────────────┐            ┌──────────────┐            ┌──────────────┐
│ 1. Parser    │            │ 3. RBAC      │            │ 5. Conflict  │            │ 6. Grounded  │
│    Engine    │────────────│    Filter    │────────────│    Resolver  │────────────│    Synthesis  │
│              │            │              │            │              │            │              │
│ 2. PII/PHI  │            │ 4. Hybrid    │            │              │            │ 7. Audit &   │
│    Gate      │            │    Rerank    │            │              │            │    Eval      │
└──────────────┘            └──────────────┘            └──────────────┘            └──────────────┘
```

### Component Responsibilities

1. **Parser Engine** — Ingest PDF/MD/CSV/JSON/XLSX; structural chunking preserving tables, sections, headers; metadata extraction (document_id, type, version, status, department, allowed_roles, page, section, table_id, row_id)
2. **PII/PHI Gate** — Detect and redact/reject synthetic identifiers at ingestion and output; demonstrate that identifiers cannot leak
3. **RBAC Filter** — Map user identity → role → allowed_roles on documents/chunks; filter BEFORE evidence reaches model context
4. **Hybrid Rerank** — BM25 (lexical) + dense embeddings → fusion → reranker → top evidence
5. **Conflict Resolver** — Detect when retrieved evidence disagrees; check lifecycle metadata (version, status, effective dates); surface both sides
6. **Grounded Synthesis** — Generate answer strictly from retrieved evidence; attach citation metadata per claim; refuse/escalate when evidence insufficient
7. **Audit & Eval** — Log every query→retrieval→response chain; reproducible evaluation with defined question set; actual measured metrics

---

## RBAC Model

```
Roles:
  - doctor          → clinical_guidelines, sops, formulary, device_manuals, operational
  - nurse           → sops, formulary, device_manuals
  - admin           → operational, payer_policies, sops
  - pharmacist      → formulary, clinical_guidelines
  - billing         → payer_policies, operational

Documents have: allowed_roles[]
Chunks inherit: parent document's allowed_roles[]

Enforcement point: retrieval filter (server-side)
                   NOT frontend visibility
```

---

## Security Invariants

These invariants must hold at all times:

1. **Retrieval-level enforcement** — Unauthorized chunks NEVER reach the LLM context window
2. **Server-side security** — RBAC decisions happen on the backend, not the browser
3. **No frontend-only hiding** — If a chunk is retrieved, it was authorized
4. **Token protection** — API keys/tokens must not be bundled into client-side JavaScript
5. **Synthetic data only** — No real patient names, IDs, phone numbers, addresses, or medical record numbers
6. **PII scan** — Output should be scanned before delivery to user

---

## Anti-Reskinning Constraints

The hackathon rules explicitly prohibit reskinning an existing project.

**NOT allowed:**
```
Old ArogyaPlus → change colors → rename buttons → call it enterprise RAG
```

**Required:**
```
Existing frontend foundation (if reused) → substantive P-02 architecture →
real ingestion → real retrieval → real RBAC → real citations →
real conflict detection → real refusal → real evaluation
```

The existing ArogyaPlus code provides a React/Vite/Tailwind shell. The P-02 implementation is the entire RAG backend + new RAG-specific frontend pages. The README must transparently describe reused foundations vs. new work.

---

## Implementation Integrity Rules

1. **Do not fake requirements** — No UI labels like "secure", "verified", "grounded" unless the implementation supports the claim
2. **Do not rely only on prompts** — Authorization, refusal, citations, privacy need application-level logic
3. **Keep security server-side** — Evidence authorization must not depend on frontend visibility
4. **Preserve provenance** — Every chunk retains document_id, page, section, table_id, row_id for citation
5. **Do not silently resolve conflicts** — Surface disagreements visibly
6. **Do not claim evaluation without evidence** — Reported scores must come from actual evaluation runs in the repo
7. **Synthetic data only** — All demo/development data must be synthetic or de-identified
8. **Prefer explicit, testable behavior** — Critical requirements should have tests

---

## Development Workflow

Before implementing any feature:

1. Which P-02 requirement does it satisfy? (R1–R8, A1–A6)
2. What real failure mode does it address?
3. Where will the implementation live?
4. How can it be tested?
5. How can a reviewer verify it works?

If a feature cannot be connected to the problem statement, do not add it merely for complexity or visual appeal.

---

## Pre-Implementation Checklist

Before writing code for any component:

- [ ] Read `context/problem.md` requirements
- [ ] Read `context/ESCAPE_VELOCITY_CONTEXT.md` architecture sections
- [ ] Identify which requirement(s) the change serves
- [ ] Verify no existing code is broken by the change
- [ ] Plan the test/verification approach
- [ ] Confirm synthetic data is used

---

## Code-Review Checklist

Before declaring the repository complete:

### Problem Fit
- [ ] P-02 is explicitly identified
- [ ] Every core requirement (R1–R8) has an implementation
- [ ] Every core requirement has a verification path

### Ingestion
- [ ] Long documents supported
- [ ] Short policies supported
- [ ] Structured records supported
- [ ] Table-heavy source supported

### Retrieval
- [ ] Natural-language query works on unseen input
- [ ] Retrieval is real (not hardcoded)
- [ ] Hybrid retrieval implemented (BM25 + dense)
- [ ] Reranking implemented

### Grounding
- [ ] Answers are based on retrieved evidence
- [ ] Unsupported claims are prevented

### Citations
- [ ] Claims map to evidence with metadata
- [ ] Evidence is accessible in one click
- [ ] Citation metadata is accurate

### Conflicts
- [ ] Conflicting sources can be represented
- [ ] Conflicts are surfaced to user

### Refusal
- [ ] Insufficient evidence produces refusal/escalation
- [ ] Missing evidence is explained

### Authorization
- [ ] User identity/role is represented
- [ ] Retrieval is permission-aware (server-side)
- [ ] Unauthorized chunks never reach the model

### Privacy
- [ ] No real patient data anywhere
- [ ] Synthetic/de-identified data used
- [ ] Leakage checks exist

### Evaluation
- [ ] Question set exists in repository
- [ ] Evaluation is reproducible
- [ ] Metrics come from actual runs

### Demo
- [ ] Judge can type unseen question → real answer
- [ ] Citations, conflicts, refusal, RBAC are demonstrable
- [ ] Demo reflects actual submitted code

### Submission
- [ ] Public GitHub repository
- [ ] README complete with AI assistance disclosure
- [ ] No prohibited data
- [ ] Submitted before 15:30

---

## File Organization

```
/
├── CLAUDE.md                    ← this file
├── AGENTS.md                    ← agent instructions
├── README.md                    ← project README (must be substantive)
├── context/
│   ├── ESCAPE_VELOCITY_CONTEXT.md
│   └── problem.md
├── backend/                     ← Python FastAPI backend
│   ├── main.py                  ← entry point
│   ├── services/                ← RAG pipeline services
│   ├── models/                  ← data models
│   ├── routers/                 ← API routes
│   └── tests/                   ← backend tests
├── frontend/                    ← React/Vite frontend
│   └── src/
│       ├── pages/               ← RAG UI pages
│       ├── components/          ← RAG components
│       └── services/            ← API client
├── corpus/                      ← synthetic clinical documents
│   ├── guidelines/
│   ├── policies/
│   ├── formulary/
│   ├── device_manuals/
│   └── metadata.json
├── evaluation/                  ← question sets + results
│   ├── questions.json
│   └── results/
└── docs/                        ← architecture documentation
```

---

## Commands

```bash
# Backend
cd backend && pip install -r requirements.txt
python main.py

# Frontend
cd frontend && npm install
npm run dev

# Tests
cd backend && python -m pytest tests/
```

---

## Critical Reminders

- **Evidence before generation.** The system generates answers from retrieved evidence, not from model knowledge.
- **Refusal is a valid product outcome.** A correct refusal is better than a confident wrong answer.
- **Security is server-side.** RBAC happens in the retrieval path, not in the UI.
- **Conflicts are features.** Surfacing disagreement is a requirement, not a bug.
- **Metrics must be real.** Never fabricate an evaluation score.
- **Deadline is 15:30.** Missing it is disqualifying.
