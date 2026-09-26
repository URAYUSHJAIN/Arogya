# Requirement Traceability (P-02)

| ID | Requirement | Implementation | Verification |
|---|---|---|---|
| R1 | Heterogeneous corpus | `ingest.py`: Markdown (long guideline, short SOP, payer policy, device manual), CSV (20-row formulary table), JSON (structured audit records) | `test_r1_all_six_sources_ingested`, `test_r1_json_records_ingested_as_records`, corpus pane |
| R2 | Natural-language QA from evidence | `pipeline.run_query` → retrieval → `synthesizer` (local LLM receives only numbered evidence) | `test_r2_r3_citations_resolve_to_retrieved_evidence`, live workspace |
| R3 | Claim-level traceability, one click | `synthesizer.verify_claims`, `citations[]` → `chunk_id`; `/api/evidence/{chunk_id}`; Trace Inspector | `test_r3_claim_verifier_removes_unsupported_and_invented_numbers`, `test_api_behaviour` |
| R4 | Conflict handling | `conflict_and_lifecycle.detect_conflicts`; conflict card | `test_r4_vancomycin_conflict_detected`, `test_r4_timing_conflict_detected`, `test_r4_no_false_conflict_on_consistent_question`, benchmark Q07–Q09 |
| R5 | Refusal + missing evidence | `sufficiency.assess` (rerank score + query-term coverage) runs before generation; `refusal_message` lists missing terms, searched docs, inaccessible categories, escalation route | `test_r5_unanswerable_question_is_refused` (asserts generator never called), Q10–Q13 |
| R6 | Retrieval-level access boundaries | `rbac` grants in PostgreSQL; `HybridIndex.authorized_indices` filters before scoring; `assert_authorized` before prompt; evidence endpoints re-check | `test_r6_billing_restricted_chunks_never_reach_synthesizer` (spy provider records model input), `test_r6_candidate_set_is_filtered_before_scoring`, `test_r6_synthesizer_rejects_unauthorized_evidence`, `test_r6_compliance_auditor_can_retrieve_restricted_audit_records` |
| R7 | Synthetic data + no identifier leakage | Synthetic corpus; `privacy.py` gate at ingestion, query, model input, output; hash registry | `test_r7_*` (4 tests), benchmark `pii_leakage` metric over full response payloads |
| R8 | Quality measurement | `corpus/eval_questions.json` (15), `evaluator.py`, `POST /api/evaluate`, `evaluation/results/latest.json` | `test_r8_evaluation_metrics_computed_and_reproducible` (two runs → identical metrics) |
| A1 | Hybrid retrieval + reranking | `retriever.py`: rank_bm25 + MiniLM → RRF → bge-reranker-base | `test_a1_*` (3 tests) |
| A2 | Clinical chunking | Heading-hierarchy + block-aware Markdown chunker; row-atomic CSV; record-atomic JSON | `test_a2_*` |
| A3 | Fine-grained citations | Section + line range, table + row, record id on every chunk | `test_a3_provenance_preserved_on_every_chunk` |
| A4 | Role/document authorization in retrieval | Same as R6 | Same as R6 |
| A5 | Groundedness evaluation | Evaluator `groundedness` = supported generator-draft claims / all draft claims | Evaluation dashboard, `latest.json` |
| A6 | Lifecycle (versioning, supersession) | `documents.status`, `document_versions` (`supersedes`, `superseded_by`, effective dates); supersession propagation in `ingest.persist`; non-current evidence excluded from answer context but shown in conflict card | `test_a6_lifecycle_supersession_persisted`, `test_a6_superseded_evidence_excluded_from_answer_context` |
