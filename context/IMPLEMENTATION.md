# IMPLEMENTATION.md --- Arogya Healthcare Enterprise RAG (Track P-02)

> **Authoritative execution blueprint for Claude Code / Codex.** Read
> this with `context/ESCAPE_VELOCITY_CONTEXT.md` and
> `context/problem.md` before modifying code.
>
> **Deadline:** 15:30 IST\
> **Code-freeze target:** 14:30 IST\
> **Core principle:** Evidence before generation.

------------------------------------------------------------------------

## 1. Objective

Build **Arogya --- Evidence-Before-Generation Engine**, a genuine
Healthcare Greenfield Enterprise RAG and Clinical Auditor Workspace.

The previous ArogyaPlus application supplies only the visual/frontend
foundation. The new product behavior is a substantive P-02
implementation.

Target pipeline:

``` text
Synthetic Corpus
  -> Parser Engine
  -> PII/PHI Gate
  -> Chunk + Index
  -> Pre-Retrieval RBAC
  -> BM25 + Dense Retrieval
  -> RRF
  -> Cross-Encoder Reranking
  -> Conflict/Lifecycle Resolver
  -> Sufficiency/Refusal Gate
  -> Grounded Synthesis
  -> Claim/Citation Verification
  -> Privacy Verification
  -> Audit + Evaluation
```

No hardcoded answers, citations, conflicts, access decisions, or
evaluation percentages.

------------------------------------------------------------------------

## 2. Current Repository State

Current repository:

``` text
/
├── README.md
├── context/
│   ├── ESCAPE_VELOCITY_CONTEXT.md
│   └── problem.md
├── frontend/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── LICENSE
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── main.jsx
│       ├── components/
│       ├── data/
│       ├── pages/
│       └── services/
└── rag-pipeline/
    └── empty
```

There is currently no backend, corpus, database schema, RAG engine,
evaluation runner, or test suite.

------------------------------------------------------------------------

## 3. Anti-Reskinning Rule

### Reuse

Reuse only legitimate frontend foundations where useful:

-   `src/index.css`
-   colors
-   typography
-   spacing
-   cards/buttons
-   responsive patterns
-   `PillLoader.jsx`
-   selected base UI primitives
-   React/Vite setup
-   appropriate brand assets

### Disconnect

Do not retain the old consumer workflow as active product behavior:

-   Doctors
-   Blog
-   Hospital Map
-   Testimonials
-   Mobile App
-   Patient-care consumer workflow
-   Emergency hospital discovery
-   Blood-report analysis as the main workflow
-   Ayurvedic recommendations

The new product is an enterprise clinical/operations knowledge system.

------------------------------------------------------------------------

# 4. Frontend Routes

`src/App.jsx` must expose exactly:

``` text
/              -> HomePage.jsx
/ai-analysis   -> AIAnalysisPage.jsx
/emergency     -> EmergencyPage.jsx
```

No other application routes are required.

------------------------------------------------------------------------

# 5. Route `/` --- Home

`HomePage.jsx` becomes the architecture landing page.

Keep the existing ArogyaPlus visual language:

-   green healthcare palette
-   existing typography
-   rounded cards
-   soft borders
-   spacing
-   responsive behavior

Rebrand the content around:

-   Enterprise Healthcare RAG
-   Evidence-Before-Generation
-   permission-aware retrieval
-   grounded answers
-   citations
-   conflict detection
-   refusal
-   auditability
-   evaluation

Primary CTA must open `/ai-analysis`.

Consumer cards such as Doctors, Blog, MapView, and Testimonials must be
unplugged from the active experience.

------------------------------------------------------------------------

# 6. Route `/ai-analysis` --- Clinical Auditor Workspace

Rebuild `src/pages/AIAnalysisPage.jsx` as the primary **Enterprise
3-Pane Clinical Auditor Workspace**.

Target:

``` text
┌────────────────────────────────────────────────────────────────────────────┐
│ AROGYA Enterprise RAG  [Role: Physician ▼] [PII Guard: 0 Leaks] [Docs: 6]│
├───────────────────┬────────────────────────────────┬──────────────────────┤
│ LEFT ~20%         │ CENTER ~50%                    │ RIGHT ~30%            │
│ Corpus & Ingest   │ Interrogate / Conflicts        │ 1-Click Trace         │
│                   │ / Citations                    │ Inspector              │
├───────────────────┼────────────────────────────────┼──────────────────────┤
│ Document list     │ Query input                    │ Document viewer       │
│ Version/status    │ Quick pills                    │ Exact passage         │
│ Access status     │ Grounded answer                │ Exact table row       │
│ + Ingest          │ Conflict card                  │ Metadata              │
│                   │ Refusal state                  │ Rerank score          │
└───────────────────┴────────────────────────────────┴──────────────────────┘
```

Use the existing medical visual theme rather than creating a completely
unrelated dashboard.

------------------------------------------------------------------------

# 7. Workspace Header

Show:

``` text
AROGYA Enterprise RAG
[Role: Physician ▼]
[PII Guard: 0 Leaks]
[Docs: 6 Active]
```

The PII and document values must come from backend/application state,
not hardcoded display text.

------------------------------------------------------------------------

# 8. Roles and Access

Exactly five demo roles:

### Physician

Access:

-   Guidelines
-   SOPs
-   Formulary
-   Payer Policies
-   Device Manuals

### Nurse

Access:

-   Guidelines
-   SOPs
-   Formulary
-   Device Manuals

### Pharmacist

Access:

-   Guidelines
-   Formulary
-   Payer Policies

### Billing Specialist

Access:

-   Formulary
-   Payer Policies

Blocked from clinical SOPs and audit records.

### Compliance Auditor

Unrestricted access to all six documents, including restricted audit
records.

Role selector lives in `Header.jsx` and shared React state.

The selected role becomes the backend synthetic user context.

**Critical:** the frontend role selector is not a security boundary.

Required:

``` text
Role
 -> backend authorization
 -> authorized candidate set
 -> retrieval
 -> reranking
 -> synthesis
```

Forbidden:

``` text
retrieve everything
 -> send everything to frontend
 -> hide restricted data with React
```

------------------------------------------------------------------------

# 9. Corpus Pane

Show the six corpus sources:

``` text
1_sepsis_clinical_guideline_2025.md
v4.2 | Active

2_ed_antibiotic_sop_2021.md
v1.4 | Superseded

3_hospital_drug_formulary_2025.csv
Table | 20 rows | Active

4_payer_prior_auth_policy_2024.md
Active

5_infusion_pump_x200_manual.md
Active

6_adverse_event_audit_records.json
Restricted
```

Expose, where available:

-   filename
-   type
-   version
-   lifecycle status
-   table/row count
-   access indicator

`+ Ingest Doc` must perform a real supported backend operation; it must
not fake ingestion.

------------------------------------------------------------------------

# 10. Synthetic Corpus

Generate directly under:

``` text
rag-pipeline/corpus/
```

Required:

``` text
1_sepsis_clinical_guideline_2025.md
2_ed_antibiotic_sop_2021.md
3_hospital_drug_formulary_2025.csv
4_payer_prior_auth_policy_2024.md
5_infusion_pump_x200_manual.md
6_adverse_event_audit_records.json
eval_questions.json
```

All data must be synthetic/de-identified.

## Corpus requirements

### 1 --- Clinical guideline

Long hierarchical Markdown guideline, version 4.2, active.

### 2 --- ED SOP

Short SOP, version 1.4, superseded, with deliberately conflicting dosage
evidence.

### 3 --- Formulary

20-row structured table with stable row IDs such as `ROW-01`,
medication/formulary fields and prior-auth information.

### 4 --- Payer policy

Prior-authorization policy useful for clinical/operations/billing
queries.

### 5 --- Device manual

Biomedical device manual containing `ERR-404`.

### 6 --- Audit records

Restricted JSON with synthetic names/MRNs to exercise privacy controls.

No real patient data.

------------------------------------------------------------------------

# 11. Ingestion Engine

Create:

``` text
rag-pipeline/ingest.py
```

Responsibilities:

1.  discover corpus files
2.  identify type
3.  parse structure
4.  preserve metadata
5.  perform privacy checks
6.  hierarchical chunk Markdown
7.  preserve table rows atomically
8.  create retrieval records
9.  persist metadata
10. build retrieval indexes

Initial formats:

``` text
Markdown
CSV
JSON
```

Do not add unnecessary parsers unless required.

------------------------------------------------------------------------

# 12. Chunking

Markdown should use hierarchical chunking:

``` text
Document
 -> Heading
   -> Subheading
     -> Paragraph group
```

Each chunk must retain provenance.

Minimum metadata:

``` text
document_id
document_name
version
status
section
subsection
chunk_id
source_type
access_class
roles_allowed
effective_from
effective_to
supersedes
```

Avoid arbitrary chunking that destroys clinical context.

------------------------------------------------------------------------

# 13. Table Handling

CSV/table data must remain row-atomic.

Each row must preserve:

``` text
table_id
row_id
column headers
cell values
document provenance
ACL metadata
```

Example:

``` text
ROW-01
Drug: Vancomycin
...
```

Backend table parsing is independent of frontend rendering.

For frontend structured evidence, use a suitable open-source React/JS
table/grid library. The library is a presentation layer and must not
replace backend parsing/provenance.

------------------------------------------------------------------------

# 14. Privacy / PII / PHI Gate

Create:

``` text
rag-pipeline/privacy.py
```

Checks must occur:

``` text
Ingestion:
raw data -> privacy scan -> safe representation

Query:
input -> validation

Output:
generated answer -> privacy scan -> safe response
```

The restricted audit corpus intentionally contains synthetic
identifiers.

The UI may show:

``` text
PII Guard: 0 Leaks
```

only when backed by actual privacy-check state.

------------------------------------------------------------------------

# 15. PostgreSQL

Use PostgreSQL as the persistent application database.

Logical entities:

``` text
documents
document_versions
chunks
table_rows
roles
permissions
document_permissions
audit_events
evaluation_questions
evaluation_runs
evaluation_results
```

The detailed schema belongs in `docs/DATA_MODEL.md`.

Do not introduce a second database unless implementation requires it.

------------------------------------------------------------------------

# 16. Retrieval Engine

Create:

``` text
rag-pipeline/retriever.py
```

Pipeline:

``` text
Query
 -> Synthetic user context
 -> Pre-retrieval ACL filter
 -> BM25
 -> Dense retrieval
 -> RRF fusion
 -> Cross-encoder reranking
 -> authorized evidence
```

------------------------------------------------------------------------

# 17. Retrieval Stack

### Dense embeddings

Use:

``` text
sentence-transformers/all-MiniLM-L6-v2
```

This is the retrieval embedding model, not the generation model.

Load once per backend process where practical.

### Lexical retrieval

Use:

``` text
rank_bm25
```

Useful for:

-   exact drug names
-   error codes
-   policy terms
-   precise phrases

### Fusion

Use Reciprocal Rank Fusion.

### Reranking

Use:

``` text
BAAI/bge-reranker-base
```

Only authorized candidates may reach reranking.

------------------------------------------------------------------------

# 18. Retrieval Metadata

Every evidence item must preserve:

``` text
document_id
document_name
version
status
chunk_id
section
row/page where applicable
source_type
access classification
BM25 score where available
dense score where available
RRF score
rerank score
```

Only safe metadata is returned to the frontend.

------------------------------------------------------------------------

# 19. Conflict and Lifecycle Resolver

Create:

``` text
rag-pipeline/conflict_and_lifecycle.py
```

Responsibilities:

-   compare relevant competing evidence
-   detect disagreement
-   inspect versions
-   detect supersession
-   distinguish active/superseded/retired sources
-   surface conflict instead of silently selecting one

The deliberate conflict is between the 2025 guideline and 2021 SOP.

Example UI concept:

``` text
⚠ CONFLICT DETECTED

Source A
2025 Guideline
Active
500mg q8h

Source B
2021 SOP
Superseded
1000mg q12h
```

The displayed values must originate from retrieved evidence, not
hardcoded UI content.

------------------------------------------------------------------------

# 20. Sufficiency and Refusal

Implement the refusal gate before synthesis.

``` text
Authorized evidence
 -> sufficiency decision
      ├── sufficient -> synthesis
      └── insufficient -> refusal
```

A refusal should state:

-   evidence is insufficient
-   what is missing when determinable
-   no unsupported answer will be generated

No confident fallback answer is allowed after refusal.

------------------------------------------------------------------------

# 21. Grounded Synthesis

Create:

``` text
rag-pipeline/synthesizer.py
```

It receives only:

-   authorized evidence
-   lifecycle/conflict result
-   sufficiency decision

It produces:

-   grounded answer
-   claim-level citation references

Then final output passes through:

``` text
citation verification
 -> privacy verification
 -> audit logging
```

------------------------------------------------------------------------

# 22. Generation Model

Do **not** use Hugging Face for text generation.

Hugging Face/open-source components are used for retrieval:

``` text
all-MiniLM-L6-v2
BAAI/bge-reranker-base
rank_bm25
```

The generation model must be local, non-cloud and non-paid.

Because the exact local generation runtime/model has not been selected
in the supplied project decisions, implement a provider adapter:

``` text
GenerationProvider
├── generate()
├── health_check()
└── model_name
```

Select the concrete local provider/model through environment
configuration.

Do not hardcode a fake answer or silently substitute a remote API.

------------------------------------------------------------------------

# 23. Citation System

Every substantive claim must map to retrieved evidence.

Example:

``` text
...requires Vancomycin 500mg IV q8h [1].
...requires Prior Authorization [2].
```

Citation targets must support:

``` text
document
version
section/page
chunk
passage
table row
JSON record
```

A citation is valid only if it resolves to actual retrieved evidence.

------------------------------------------------------------------------

# 24. One-Click Trace Inspector

Clicking `[1]` or `[2]` must open the corresponding evidence in the
right pane.

Text:

``` text
document
 -> section
 -> exact passage
 -> highlight
```

Table:

``` text
document
 -> table
 -> exact ROW-XX
 -> amber highlight
```

The right pane should auto-scroll where practical.

------------------------------------------------------------------------

# 25. Right Pane

The trace inspector should show:

``` text
DOCUMENT VIEWER

Document
Version
Status
Section / Row
Exact evidence
Retrieval metadata
Rerank score
```

Rerank scores must come from the backend.

Do not display invented example values.

------------------------------------------------------------------------

# 26. Quick Query Pills

Optional quick pills:

``` text
Formulary
Conflict
Refusal
```

They may populate/execute real corpus queries.

They must never map directly to canned answers.

------------------------------------------------------------------------

# 27. Route `/emergency`

Rebrand `EmergencyPage.jsx` as:

> **Audit, Groundedness & Evaluation Dashboard**

Single primary action:

``` text
Run Live Benchmark Suite (15 Queries)
```

This must call:

``` http
POST /api/evaluate
```

and display real results.

------------------------------------------------------------------------

# 28. Evaluation Benchmark

Use exactly 15 benchmark questions in:

``` text
rag-pipeline/corpus/eval_questions.json
```

The suite should cover:

-   normal grounded questions
-   multi-document questions
-   conflicts
-   unanswerable/refusal cases
-   authorization-sensitive cases

Questions must execute through the real pipeline.

------------------------------------------------------------------------

# 29. Evaluation Metrics

Display real computed values for:

``` text
Groundedness
Citation Precision
Conflict Detection
Refusal Accuracy
PII Leakage
```

Do not hardcode any percentage.

`PII Leakage = 0%` may be shown only when the benchmark actually detects
zero leaks.

------------------------------------------------------------------------

# 30. Evaluation API

Implement:

``` http
POST /api/evaluate
```

Response should contain:

``` text
run_id
total_questions
completed_questions
metrics
per_question_results
timestamp
```

The frontend renders returned values.

------------------------------------------------------------------------

# 31. Audit Logging

Every query should produce a safe audit event containing, where
applicable:

``` text
timestamp
role
query
retrieved document IDs
retrieved chunk IDs
authorization result
conflict result
sufficiency decision
answer/refusal status
citation IDs
privacy result
```

Avoid unnecessarily storing raw sensitive content.

------------------------------------------------------------------------

# 32. FastAPI

Create:

``` text
rag-pipeline/server.py
```

FastAPI owns:

-   ingestion
-   retrieval
-   RBAC
-   privacy
-   conflict/lifecycle
-   sufficiency/refusal
-   synthesis
-   citation validation
-   evaluation
-   audit logging

The frontend never calls model providers directly.

------------------------------------------------------------------------

# 33. API Surface

Initial API:

``` http
GET  /api/health
GET  /api/documents
POST /api/ingest
POST /api/query
POST /api/evaluate
GET  /api/audit
```

Exact schemas belong in `docs/API.md`.

------------------------------------------------------------------------

# 34. Query API

Initial contract:

``` http
POST /api/query
```

Example request shape:

``` json
{
  "query": "Adult sepsis dosage for vancomycin?",
  "role": "Physician"
}
```

Backend sequence:

``` text
validate role
 -> construct synthetic context
 -> ACL filter
 -> retrieval
 -> reranking
 -> conflict/lifecycle
 -> sufficiency
 -> synthesis/refusal
 -> citation validation
 -> privacy validation
 -> audit
 -> response
```

------------------------------------------------------------------------

# 35. Frontend Service Layer

Refactor:

``` text
frontend/src/services/aiService.js
```

It should call the FastAPI backend for:

-   query
-   documents
-   ingestion
-   evaluation
-   audit

The old client-side Gemini flow must not remain the primary
architecture.

No model/API secret should be exposed in frontend code.

------------------------------------------------------------------------

# 36. Frontend Component Direction

Create reusable components as needed, for example:

``` text
CorpusPane.jsx
QueryPanel.jsx
AnswerPanel.jsx
ConflictCard.jsx
CitationList.jsx
TraceInspector.jsx
EvidenceViewer.jsx
TableEvidenceViewer.jsx
RefusalCard.jsx
RoleSelector.jsx
PrivacyStatus.jsx
```

`AIAnalysisPage.jsx` should orchestrate the workspace rather than become
a huge monolith.

------------------------------------------------------------------------

# 37. Error States

Handle:

``` text
backend unavailable
database unavailable
parsing failure
embedding failure
reranker failure
generation provider unavailable
no relevant evidence
insufficient evidence
unauthorized access
conflict
privacy violation
evaluation failure
```

All should have clear user-facing states.

------------------------------------------------------------------------

# 38. Performance

For live hackathon use:

-   load models once
-   avoid rebuilding embeddings per query
-   persist/cache corpus indexes
-   keep retrieval top-k bounded
-   keep reranking bounded
-   avoid loading the whole corpus into the browser
-   use loading states
-   avoid unnecessary frontend re-renders

Target a responsive live query workflow.

------------------------------------------------------------------------

# 39. Security Invariants

These are non-negotiable:

1.  Unauthorized documents never reach synthesis.
2.  Frontend cannot grant access.
3.  LLM cannot invent citation targets.
4.  Every citation resolves to actual retrieved evidence.
5.  Insufficient evidence causes refusal.
6.  PII/PHI checks occur before indexing and before final response.
7.  Evaluation numbers are computed.

Forbidden patterns:

``` text
if query.includes("sepsis") return hardcodedAnswer
```

``` text
const evaluation = 96
```

``` text
if role === "Physician" showAllDocuments()
```

``` text
citation = fakeSource
```

------------------------------------------------------------------------

# 40. Testing

Create:

``` text
rag-pipeline/tests/test_p02_requirements.py
```

Test:

### R1

All six corpus files parse.

### R2

Citations resolve to evidence.

### R3

Unsupported claims are prevented/refused.

### R4

The deliberate conflict is surfaced.

### R5

Insufficient evidence causes refusal.

### R6

Unauthorized evidence never reaches retrieval/synthesis.

### R7

Synthetic identifiers do not leak.

### R8

Evaluation metrics are computed.

### A1

BM25 + dense retrieval + fusion work.

### A2

Hierarchical and table-aware chunking work.

### A3

Fine-grained provenance exists.

### A4

RBAC is enforced before model context.

### A5

Evaluation is reproducible.

### A6

Lifecycle metadata affects conflict handling.

------------------------------------------------------------------------

# 41. Demo Scenarios

The live demo must support:

## 1. Normal grounded question

Answer + citations + exact evidence.

## 2. One-click citation

Click citation -\> right pane -\> exact passage/row.

## 3. Conflict

Question requiring both 2025 guideline and 2021 SOP.

Show:

-   both sources
-   lifecycle status
-   conflict
-   no silent merge

## 4. Refusal

Ask unsupported question.

Show:

-   refusal
-   evidence insufficiency
-   missing evidence where determinable

## 5. RBAC

Query restricted evidence as unauthorized role.

Then switch to Compliance Auditor and verify authorized retrieval.

## 6. Table evidence

Ask formulary question.

Show exact `ROW-XX` in right pane with highlight.

## 7. PII

Exercise restricted audit data and verify no identifier leaks into
generated answer.

## 8. Evaluation

Run:

``` text
Run Live Benchmark Suite (15 Queries)
```

and show real metrics.

------------------------------------------------------------------------

# 42. Implementation Order

Implement in this order.

## Phase 1 --- Backend foundation

1.  FastAPI
2.  configuration
3.  PostgreSQL connection
4.  health endpoint

## Phase 2 --- Corpus

5.  Generate six synthetic documents
6.  Add metadata
7.  Add ACLs
8.  Add lifecycle metadata
9.  Add 15 evaluation questions

## Phase 3 --- Ingestion

10. Markdown parser
11. CSV parser
12. JSON parser
13. hierarchical chunking
14. row-atomic table serialization
15. privacy gate
16. persistence/indexing

## Phase 4 --- Retrieval

17. BM25
18. dense embeddings
19. RRF
20. pre-retrieval RBAC
21. reranker
22. retrieval metadata

## Phase 5 --- Reasoning safeguards

23. lifecycle resolver
24. conflict detection
25. sufficiency/refusal
26. generation provider adapter
27. grounded synthesis
28. citation validation
29. final privacy validation

## Phase 6 --- API

30. `/api/documents`
31. `/api/ingest`
32. `/api/query`
33. `/api/evaluate`
34. `/api/audit`

## Phase 7 --- Frontend

35. three routes
36. Home redesign
37. three-pane workspace
38. role selector
39. corpus pane
40. query/answer
41. conflict/refusal
42. citations
43. trace inspector
44. table evidence viewer
45. evaluation dashboard

## Phase 8 --- Tests

46. requirement tests
47. authorization tests
48. privacy tests
49. citation tests
50. conflict tests
51. refusal tests
52. evaluation tests

## Phase 9 --- Demo hardening

53. ingest corpus
54. run benchmark
55. test unseen queries
56. test all roles
57. test all demo scenarios
58. remove all fake/hardcoded paths
59. verify no frontend secrets
60. freeze code

------------------------------------------------------------------------

# 43. Definition of Done

## Ingestion

-   six files exist
-   all parse
-   metadata persists
-   lifecycle persists
-   ACL persists
-   table rows retain IDs
-   privacy checks execute
-   chunks are indexed

## Retrieval

-   BM25 works
-   dense retrieval works
-   RRF works
-   reranker works
-   ACL is applied before retrieval context
-   provenance survives retrieval

## Grounding

-   claims have evidence
-   citations resolve
-   exact passages/rows display
-   unsupported questions refuse
-   conflicts surface
-   final privacy validation executes

## UI

-   exactly three routes
-   existing Arogya visual language preserved
-   three-pane workbench works
-   role selector works
-   corpus works
-   live query works
-   citations are clickable
-   trace inspector works
-   table evidence highlights
-   conflicts work
-   refusals work
-   evaluation works

## Evaluation

``` text
Button
 -> POST /api/evaluate
 -> 15 real questions
 -> real pipeline
 -> real metrics
 -> dashboard
```

No fabricated metric.

------------------------------------------------------------------------

# 44. Local Runtime

The target architecture is:

``` text
Browser
  ↓
React/Vite
  ↓
FastAPI
  ↓
PostgreSQL
  ↓
Local retrieval models
  ↓
Local generation provider
```

Constraints:

-   no cloud
-   no paid API
-   no unnecessary microservices
-   no Kubernetes
-   no production identity platform
-   no real patient data

------------------------------------------------------------------------

# 45. Generation Provider Constraint

The retrieval stack is fixed to:

``` text
sentence-transformers/all-MiniLM-L6-v2
BAAI/bge-reranker-base
rank_bm25
```

The text-generation model/provider is intentionally implemented behind
an adapter because the supplied project decisions do not yet specify the
concrete local generation runtime.

The implementation must therefore expose a configuration point such as:

``` text
GENERATION_PROVIDER
GENERATION_MODEL
```

A concrete local, non-paid, non-cloud generation runtime must be
configured before the live demo.

Do not replace it with a cloud API or fake answer path.

------------------------------------------------------------------------

# 46. Documentation Structure

After implementation, maintain:

``` text
README.md
AGENTS.md
CLAUDE.md

context/
├── ESCAPE_VELOCITY_CONTEXT.md
├── problem.md
└── IMPLEMENTATION.md

docs/
├── REQUIREMENTS.md
├── ARCHITECTURE.md
├── EXISTING_CODEBASE.md
├── DATA_MODEL.md
├── RETRIEVAL.md
├── SECURITY.md
├── CITATIONS.md
├── CONFLICTS.md
├── EVALUATION.md
├── TESTING.md
├── API.md
├── UI_UX.md
└── DEMO.md
```

These are project documentation files, not files technically required by
Claude Code.

`IMPLEMENTATION.md` is the execution blueprint. Specialized docs should
add detail without contradicting it.

------------------------------------------------------------------------

# 47. Source-of-Truth Hierarchy

When implementation documents disagree:

``` text
1. Official hackathon rules / P-02 statement
2. context/ESCAPE_VELOCITY_CONTEXT.md
3. context/problem.md
4. context/IMPLEMENTATION.md
5. Specialized docs in docs/
6. Existing source code
```

Do not silently override an official requirement.

------------------------------------------------------------------------

# 48. Final Architecture

``` text
                         React / Arogya UI
                                │
                              REST
                                │
                         ┌──────▼──────┐
                         │   FastAPI   │
                         └──────┬──────┘
                                │
        ┌───────────────────────┼──────────────────────┐
        │                       │                      │
        ▼                       ▼                      ▼
      RBAC                 Query Pipeline             Audit
        │                       │                      │
        │              ┌────────▼────────┐            │
        │              │ Sufficiency +   │            │
        │              │ Conflict/Life   │            │
        │              └────────┬────────┘            │
        │                       │                      │
        └──────────────► Hybrid Retrieval ◄───────────┘
                         │
                 BM25 + Dense + RRF
                         │
                    Cross Encoder
                         │
                  Authorized Evidence
                         │
                 Grounded Synthesis
                         │
              Citation + PII Verification
                         │
                    Safe Response

Corpus
  ↓
Parser
  ↓
Privacy Gate
  ↓
Hierarchical / Table-Aware Chunker
  ↓
PostgreSQL + Retrieval Index
```

------------------------------------------------------------------------

# 49. Engineering Principle

The product is not a generic healthcare chatbot.

The system must demonstrate:

``` text
Question
   ↓
Was evidence found?
   ↓
Was evidence authorized?
   ↓
Do sources disagree?
   ↓
Is evidence sufficient?
   ↓
Can the answer prove its claims?
   ↓
Can the reviewer inspect the exact source?
   ↓
Was the result audited and measurable?
```

The product promise is:

> **Arogya does not optimize for an answer. It optimizes for an answer
> that can prove why it is allowed to exist.**
