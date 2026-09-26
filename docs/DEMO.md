# Demo Script (3 minutes)

Start: backend `cd rag-pipeline && python server.py`, frontend `cd frontend && npm run dev`,
open `http://localhost:5173/ai-analysis`. The first query after startup loads the local LLM
(~20 s); later queries take roughly 5–15 s on CPU.

| # | Role | Action | What to point at |
|---|---|---|---|
| 1 Normal | Physician | "What is the recommended adult sepsis vancomycin regimen?" | Grounded answer with citation chips; per-claim support %; generator name |
| 2 One-click | — | Click `[1]` | Trace Inspector: guideline §4.2 highlighted, lines, version 4.2 ACTIVE, BM25/dense/RRF/rerank scores |
| 3 Conflict | Physician | (same answer) | Conflict card: Source A 2025 guideline `15 mg/kg q12h` ACTIVE vs Source B 2021 SOP `1 g q12h` SUPERSEDED; the answer uses only active evidence |
| 4 Refusal | Physician | "What is the hospital policy on CAR-T cell therapy reimbursement?" | Refusal card: reason, missing terms, searched documents, escalation; no answer text |
| 5 RBAC | Billing Specialist | "Which adverse events involving vancomycin are recorded in the audit records?" | Refused; header shows chunks excluded pre-retrieval; corpus pane shows audit/guideline LOCKED. Switch to **Compliance Auditor**, ask "Which adverse events involved the X200 infusion pump?" → answered from AE-2025-003 / AE-2025-005 with identifiers redacted |
| 6 Table | Pharmacist | "What formulary tier and restriction apply to linezolid?" | Citation opens the formulary table with ROW-04 highlighted |
| 7 Error code | Nurse | "What does ERR-404 mean on the X200 infusion pump?" | Retrieval trace: manual §3.1 found by BM25 rank 1 (exact code) |
| 8 Evaluation | — | Go to Evaluation → **Run Live Benchmark Suite (15 Queries)** | Metrics tiles, per-question checks, audit events. (~2–4 min with the local LLM) |

Unseen questions: any question works; answers come only from authorized evidence, or the
system refuses.
