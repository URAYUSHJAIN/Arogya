# Citations (R3 / A3)

## Generation of citations

1. Context evidence is numbered `[1]..[k]` (`pipeline.run_query`), with headers carrying
   document id, version, status, section / row / record.
2. The local generator is instructed to end each sentence with `[n]`.
3. `synthesizer.verify_claims` splits the draft into sentences and, per sentence:
   * drops citation numbers that were not supplied (`invalid_citations`);
   * if uncited, attributes it to the best-supporting passage **only if** it passes the checks
     below (flagged `auto_attributed`);
   * computes `support` = share of the sentence's content words present in the cited passage(s);
   * lists numbers in the sentence that do not appear in the cited passage(s).
   A sentence is kept only if it has a valid citation, `support ≥ 0.5` and no unsupported numbers.
   Removed sentences are returned under `verification.removed_claims` with a reason.
4. `citations[]` is built from the kept claims' evidence numbers → actual `chunk_id`s.

## Citation object

```json
{"ref": 2, "chunk_id": "DOC-FORM-2025#CHK-0001", "document_id": "DOC-FORM-2025",
 "title": "...", "version": "2025.1", "status": "active", "section": "TBL-FORM-2025",
 "table_id": "TBL-FORM-2025", "row_id": "ROW-01", "record_id": null,
 "chunk_type": "table_row", "rerank_score": 0.93}
```

## One-click trace

Clicking a citation chip calls `GET /api/evidence/{chunk_id}?role=…` (re-authorized). The Trace
Inspector shows document, version, lifecycle, source file, section/heading path, line range,
BM25/dense/RRF/rerank scores, and:

* text evidence – the whole document's chunks with the cited passage highlighted and scrolled into view;
* table evidence – the full table (TanStack Table) with the cited `ROW-xx` highlighted in amber;
* JSON evidence – the record list with the cited record highlighted (identifiers redacted).
