# Retrieval

Implemented in `rag-pipeline/retriever.py` (`HybridIndex.retrieve`).

## Stages

1. **Pre-retrieval ACL** – `authorized_indices(ctx)` keeps only chunks whose `document_id` is
   in the role's `document_permissions` (loaded from PostgreSQL). Everything below operates on
   this subset only.
2. **BM25** – `rank_bm25.BM25Okapi` over the authorized subset (cached per role + index
   version). The tokenizer keeps hyphenated identifiers whole *and* split
   (`err-404`, `err`, `404`), so exact codes like `ERR-404`, `ROW-01`, `PA-ANTI-117` match.
   Top `BM25_TOP_K` (20).
3. **Dense** – `sentence-transformers/all-MiniLM-L6-v2`, L2-normalised; cosine = dot product
   against the authorized rows of the embedding matrix. Top `DENSE_TOP_K` (20).
4. **Reciprocal Rank Fusion** – `score = Σ 1/(60 + rank)` across both lists; top
   `RERANK_CANDIDATES` (14) survive.
5. **Cross-encoder rerank** – `BAAI/bge-reranker-base` scores `(query, title | heading path |
   passage)`; logits are sigmoid-normalised to 0..1.
6. **Context selection** (`pipeline.select_context`) – top 2 always, others if
   `rerank ≥ max(0.05, 0.15 × top)`, capped at `CONTEXT_TOP_K` (6).

Each evidence item returned to the client carries `bm25_score/rank`, `dense_score/rank`,
`rrf_score`, `rerank_score` and `sources` (`bm25`, `dense`, or both).

## Chunking (A2)

* **Markdown** – YAML-style front matter → document metadata. Headings build a stack
  (`# title > ## section > ### subsection`); numbered headings yield `section` = `4.2`.
  Body lines are grouped into structural blocks (paragraph / list / table). Blocks of one leaf
  section are packed up to 170 words without splitting a block; tables become row-atomic
  chunks. Every chunk keeps `heading_path` and `line_start–line_end`. Because chunk size is
  bounded per section rather than per document, the same code handles ~200-page guidelines.
* **CSV** – one chunk per row (`table_row`), `row_id` column preserved; full cells stored in
  `table_rows`.
* **JSON** – one chunk per record (`json_record`) with `record_id`; PII fields redacted.
* **Contextual index text** – `index_text = "<title> (v<version>, <status>) | <heading path>\n<passage>"`
  is what BM25 and the embedder see, so short chunks inherit document/section context.

## Why these models

* MiniLM-L6-v2: 384-d, fast on CPU, adequate semantic recall for a small corpus.
* bge-reranker-base: cross-attention scoring separates "mentions the same drug" from
  "answers the question", which the sufficiency gate depends on.
