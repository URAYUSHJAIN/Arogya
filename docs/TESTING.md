# Testing

```bash
cd rag-pipeline
python -m pytest tests -q
```

Requirements: PostgreSQL reachable via `DATABASE_URL` (the suite exits with a clear message
otherwise) and the cached retrieval models. The session fixture re-ingests the corpus
(`ingest.bootstrap(force=True)`) and reloads the index.

Generation in tests uses `SpyProvider` (`tests/conftest.py`): a deterministic local extractive
provider that **records every evidence item and the full prompt handed to the model**. This is
what lets the RBAC tests assert on the actual model input rather than on UI output. The neural
`transformers` provider is exercised by the evaluator and the live demo.

| Area | Tests |
|---|---|
| Markdown / CSV / JSON ingestion | `test_r1_all_six_sources_ingested`, `test_a2_markdown_hierarchical_chunking_preserves_sections`, `test_a2_csv_table_rows_are_atomic_with_row_ids`, `test_r1_json_records_ingested_as_records`, `test_unsupported_format_raises_clear_error` |
| Provenance | `test_a3_provenance_preserved_on_every_chunk` |
| PII detection / protection | `test_r7_pii_detection_patterns`, `test_r7_ingestion_redacts_identifiers_before_storage`, `test_r7_output_gate_blocks_registered_identifier`, `test_r7_pii_probe_query_does_not_leak` |
| BM25 / dense / hybrid / rerank | `test_a1_bm25_exact_error_code`, `test_a1_dense_semantic_retrieval`, `test_a1_hybrid_fusion_and_reranking` |
| RBAC / restricted exclusion | `test_r6_unknown_role_rejected`, `test_r6_billing_restricted_chunks_never_reach_synthesizer`, `test_r6_candidate_set_is_filtered_before_scoring`, `test_r6_compliance_auditor_can_retrieve_restricted_audit_records`, `test_r6_synthesizer_rejects_unauthorized_evidence` |
| Conflict / lifecycle | `test_r4_vancomycin_conflict_detected`, `test_r4_timing_conflict_detected`, `test_r4_no_false_conflict_on_consistent_question`, `test_a6_lifecycle_supersession_persisted`, `test_a6_superseded_evidence_excluded_from_answer_context` |
| Refusal | `test_r5_unanswerable_question_is_refused` (×2, asserts the generator is never invoked) |
| Citations | `test_r2_r3_citations_resolve_to_retrieved_evidence`, `test_r3_claim_verifier_removes_unsupported_and_invented_numbers`, `test_r3_evidence_endpoint_logic_row_citation` |
| Evaluation reproducibility | `test_r8_evaluation_metrics_computed_and_reproducible` (two full runs → identical metrics, 0 PII leakage, 0 unauthorized evidence) |
| API | `test_api_behaviour` (health, ACL flags, query, 403 for unknown role and for unauthorized evidence, row resolution) |

Last run (Docker PostgreSQL 16, 2026-09-26): **30 passed** in 288 s.
