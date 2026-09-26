# Conflicts & Lifecycle (R4 / A6)

Implemented in `rag-pipeline/conflict_and_lifecycle.py`.

## Detection algorithm

1. **Subjects** – medication names read at runtime from the ingested formulary table
   (`table_rows.cells->>'medication'`) plus the generic subject `antibiotic`. Relevant subjects
   are those mentioned in the query (or, if none, in the top-ranked passage).
2. **Claim extraction** per retrieved passage, per sentence:
   * *regimen* – each frequency (`every N hours`, `qNh`) is paired with the nearest preceding dose
     (`g`, `mg`, `mg/kg`, `mcg/kg/min`, `units/min`) within 60 characters, and attributed to the
     nearest preceding medication. Units are normalised (`1000 mg` → `1 g`).
   * *timing* – `within N hours|minutes|days` in a sentence mentioning the subject.
3. **Comparison** – for each `(subject, kind)` asserted by ≥2 documents, documents whose value sets
   are disjoint are in conflict.
4. **Lifecycle** – each side gets `status`, `version`, `effective_from/to`, `supersedes`,
   `superseded_by`, `is_current`. The assessment states whether lifecycle metadata suggests
   precedence (active vs superseded) or whether active sources disagree (escalate).

Nothing is silently resolved: the response always includes the `conflicts` array and the UI
renders a conflict card with both claims, values and lifecycle labels. The answer body is
generated only from **active** evidence and is labelled as such.

## Designed-in corpus conflicts

| Subject | DOC-SEP-2025 v4.2 (active) | DOC-SOP-ED-2021 v1.4 (superseded) |
|---|---|---|
| Vancomycin | 25 mg/kg load, 15 mg/kg q12h | 1 g q12h fixed |
| Piperacillin-tazobactam | 4.5 g q6h extended infusion | 3.375 g q8h |
| Antibiotic timing | within 1 hour of recognition | within 3 hours of triage |

These values live only in the corpus files; the detector has no knowledge of them.

## Lifecycle behaviour

* `status` ∈ active / superseded / retired / draft, persisted in `documents` and `document_versions`.
* Ingesting an active document with `supersedes: X` marks `X` superseded (`ingest.persist`).
* Evidence whose document is not current is excluded from the generator's context
  (`partition_by_lifecycle`); if only non-current evidence matches, the answer carries a
  `lifecycle_warning`.
