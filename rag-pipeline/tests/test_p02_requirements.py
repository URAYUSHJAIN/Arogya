"""P-02 requirement tests. Each test names the requirement it verifies.

Run:  cd rag-pipeline && python -m pytest tests -q
Requires PostgreSQL (DATABASE_URL) and the cached retrieval models.
Generation uses a deterministic local spy provider so tests are fast and
reproducible; the transformers provider is exercised by the evaluator/demo.
"""
from pathlib import Path

import pytest

import conflict_and_lifecycle as cl
import database as db
import evaluator
import ingest
import pipeline
import privacy
import rbac
import synthesizer
from config import settings
from retriever import INDEX, tokenize

CORPUS = settings.corpus_dir


def _docs(resp):
    return {e["document_id"] for e in resp["evidence"]}


# ---------------------------------------------------------------- R1 / A2 ingestion
def test_r1_all_six_sources_ingested():
    docs = {r["document_id"]: r for r in db.fetch_all("SELECT document_id, source_type FROM documents")}
    for d in ["DOC-SEP-2025", "DOC-SOP-ED-2021", "DOC-FORM-2025", "DOC-PAY-2024", "DOC-DEV-X200", "DOC-AUD-AE-2025"]:
        assert d in docs
    assert {docs["DOC-SEP-2025"]["source_type"], docs["DOC-FORM-2025"]["source_type"],
            docs["DOC-AUD-AE-2025"]["source_type"]} == {"markdown", "csv", "json"}


def test_a2_markdown_hierarchical_chunking_preserves_sections():
    parsed = ingest.parse_file(CORPUS / "1_sepsis_clinical_guideline_2025.md")
    vanc = [c for c in parsed.chunks if c.section == "4.2"]
    assert vanc, "section 4.2 must be its own chunk"
    assert "Vancomycin Dosing in Adults" in vanc[0].heading_path
    assert vanc[0].line_start and vanc[0].line_end >= vanc[0].line_start
    # heading-aware: no chunk mixes two leaf sections
    assert all("## " not in c.content for c in parsed.chunks)


def test_a2_csv_table_rows_are_atomic_with_row_ids():
    rows = db.fetch_all("SELECT row_id, columns, cells, table_id, version FROM table_rows "
                        "WHERE document_id='DOC-FORM-2025' ORDER BY row_index")
    assert len(rows) == 20
    assert rows[0]["row_id"] == "ROW-01" and rows[0]["cells"]["medication"] == "Vancomycin"
    assert "formulary_tier" in rows[0]["columns"] and rows[0]["table_id"] == "TBL-FORM-2025"


def test_r1_json_records_ingested_as_records():
    chunks = [c for c in INDEX.chunks if c["document_id"] == "DOC-AUD-AE-2025"]
    assert len(chunks) == 6 and all(c["chunk_type"] == "json_record" for c in chunks)
    assert {c["record_id"] for c in chunks} >= {"AE-2025-001", "AE-2025-006"}


def test_a3_provenance_preserved_on_every_chunk():
    for c in INDEX.chunks:
        assert c["chunk_id"].startswith(c["document_id"] + "#CHK-")
        assert c["version"] and c["status"] and c["category"] and c["source_file"]
        if c["chunk_type"] == "table_row":
            assert c["table_id"] and c["row_id"]
        if c["chunk_type"] == "section_text":
            assert c["heading_path"] and c["line_start"]


def test_unsupported_format_raises_clear_error(tmp_path):
    p = tmp_path / "x.pdf"
    p.write_bytes(b"%PDF")
    with pytest.raises(ingest.UnsupportedFormat):
        ingest.parse_file(p)


# ---------------------------------------------------------------- R7 privacy
def test_r7_pii_detection_patterns():
    text = "Patient: Jane Example, MRN SYN-MRN-0099, DOB: 1970-01-01, call 555-010-1234, j@example.test, 5 Test Road"
    res = privacy.redact_text(text)
    types = res.by_type()
    for t in ("MRN", "PHONE", "EMAIL", "DOB", "ADDRESS", "NAME"):
        assert types.get(t), f"{t} not detected"
    assert "SYN-MRN-0099" not in res.text and "555-010-1234" not in res.text


def test_r7_ingestion_redacts_identifiers_before_storage():
    rows = db.fetch_all("SELECT content, index_text FROM chunks WHERE document_id='DOC-AUD-AE-2025'")
    blob = " ".join(r["content"] + r["index_text"] for r in rows)
    for raw in ("SYN-MRN-0001", "Synthia", "Testpatient", "555-010-4471", "synthia.testpatient@example.test", "1961-04-02"):
        assert raw not in blob
    assert "[REDACTED-MRN]" in blob
    assert db.fetch_one("SELECT count(*) AS n FROM pii_registry")["n"] > 0


def test_r7_output_gate_blocks_registered_identifier():
    reg = pipeline.pii_registry()
    leaked = "The patient Orrin Placeholder (SYN-MRN-0002) had AKI."
    assert privacy.contains_leak(leaked, reg)["leaked"]
    gated = privacy.output_gate(leaked, reg)
    assert "Orrin" not in gated.text and "Placeholder" not in gated.text and "SYN-MRN-0002" not in gated.text
    assert not privacy.contains_leak(gated.text, reg)["leaked"]


def test_r7_pii_probe_query_does_not_leak(spy):
    resp = pipeline.run_query("Compliance Auditor",
                              "What is the name, MRN and phone number of the patient in adverse event AE-2025-002?",
                              audit=False)
    import json
    payload = json.dumps(resp)
    assert not privacy.contains_leak(payload, pipeline.pii_registry())["leaked"]
    assert "Orrin" not in payload and "SYN-MRN-0002" not in payload


# ---------------------------------------------------------------- A1 retrieval
def _ctx(role):
    return rbac.build_user_context(role)


def test_a1_bm25_exact_error_code():
    ctx = _ctx("Nurse")
    hits = INDEX.bm25_search(ctx, "ERR-404", INDEX.authorized_indices(ctx), 5)
    assert INDEX.chunks[hits[0][0]]["document_id"] == "DOC-DEV-X200"
    assert "ERR-404" in INDEX.chunks[hits[0][0]]["content"]
    assert "err-404" in tokenize("What does ERR-404 mean?")


def test_a1_dense_semantic_retrieval():
    ctx = _ctx("Physician")
    hits = INDEX.dense_search("which blood pressure medicine should be started first in shock",
                              INDEX.authorized_indices(ctx), 5)
    assert any("Norepinephrine is the first-line vasopressor" in INDEX.chunks[i]["content"] for i, _ in hits)


def test_a1_hybrid_fusion_and_reranking():
    out = INDEX.retrieve(_ctx("Physician"), "What does ERR-404 mean on the X200 infusion pump?")
    cands = out["candidates"]
    assert cands and all(c.rerank_score is not None and c.rrf_score > 0 for c in cands)
    assert cands == sorted(cands, key=lambda c: -c.rerank_score)
    assert "ERR-404" in cands[0].chunk["content"]
    assert any(len(c.sources) == 2 for c in cands), "some candidates should be found by both BM25 and dense"


# ---------------------------------------------------------------- R6 / A4 RBAC
def test_r6_unknown_role_rejected():
    with pytest.raises(rbac.AuthorizationError):
        rbac.build_user_context("Administrator")


def test_r6_billing_restricted_chunks_never_reach_synthesizer(spy):
    trace = {}
    resp = pipeline.run_query("Billing Specialist",
                              "Which adverse events involving vancomycin are recorded in the audit records and what was the root cause?",
                              audit=False, trace=trace)
    forbidden = {"DOC-AUD-AE-2025", "DOC-SEP-2025", "DOC-SOP-ED-2021", "DOC-DEV-X200"}
    assert not (_docs(resp) & forbidden)
    for call in spy.calls:
        assert not ({e["document_id"] for e in call["evidence"]} & forbidden)
        assert "AE-2025" not in call["prompt"]
    assert resp["retrieval"]["excluded_by_acl"] > 0


def test_r6_candidate_set_is_filtered_before_scoring():
    ctx = _ctx("Billing Specialist")
    idxs = INDEX.authorized_indices(ctx)
    assert {INDEX.chunks[i]["document_id"] for i in idxs} == {"DOC-FORM-2025", "DOC-PAY-2024"}
    out = INDEX.retrieve(ctx, "vancomycin infusion reaction adverse event root cause")
    assert {c.chunk["document_id"] for c in out["candidates"]} <= {"DOC-FORM-2025", "DOC-PAY-2024"}


def test_r6_compliance_auditor_can_retrieve_restricted_audit_records(spy):
    resp = pipeline.run_query("Compliance Auditor", "Which adverse events involved the X200 infusion pump?", audit=False)
    assert "DOC-AUD-AE-2025" in _docs(resp)
    assert resp["status"].startswith("answered")


def test_r6_synthesizer_rejects_unauthorized_evidence():
    ctx = _ctx("Billing Specialist")
    audit_chunk = next(c for c in INDEX.chunks if c["document_id"] == "DOC-AUD-AE-2025")
    with pytest.raises(rbac.AuthorizationError):
        synthesizer.synthesize(ctx, "q", [(1, audit_chunk)])


# ---------------------------------------------------------------- R4 / A6 conflicts & lifecycle
def test_r4_vancomycin_conflict_detected(spy):
    resp = pipeline.run_query("Physician", "What is the recommended adult sepsis vancomycin regimen?", audit=False)
    assert resp["conflicts"], "2025 guideline vs 2021 SOP must be surfaced"
    c = next(c for c in resp["conflicts"] if c["subject"] == "vancomycin")
    docs = {s["document_id"] for s in c["sources"]}
    assert {"DOC-SEP-2025", "DOC-SOP-ED-2021"} <= docs
    sop = next(s for s in c["sources"] if s["document_id"] == "DOC-SOP-ED-2021")
    assert sop["lifecycle"]["status"] == "superseded" and not sop["lifecycle"]["is_current"]
    assert resp["status"] == "answered_with_conflict"


def test_r4_timing_conflict_detected(spy):
    resp = pipeline.run_query("Nurse", "How soon after sepsis is recognised must antibiotics be given?", audit=False)
    kinds = {(c["subject"], c["kind"]) for c in resp["conflicts"]}
    assert ("antibiotic", "timing") in kinds


def test_r4_no_false_conflict_on_consistent_question(spy):
    resp = pipeline.run_query("Nurse", "What does ERR-404 mean on the X200 infusion pump?", audit=False)
    assert resp["conflicts"] == []


def test_a6_lifecycle_supersession_persisted():
    sop = db.fetch_one("SELECT status FROM documents WHERE document_id='DOC-SOP-ED-2021'")
    assert sop["status"] == "superseded"
    v = db.fetch_one("SELECT superseded_by FROM document_versions WHERE document_id='DOC-SOP-ED-2021'")
    assert v["superseded_by"] == "DOC-SEP-2025"


def test_a6_superseded_evidence_excluded_from_answer_context(spy):
    pipeline.run_query("Physician", "What is the recommended adult sepsis vancomycin regimen?", audit=False)
    for call in spy.calls:
        assert all(e["status"] == "active" for e in call["evidence"])


# ---------------------------------------------------------------- R5 refusal
@pytest.mark.parametrize("role,q", [
    ("Physician", "What is the hospital's reimbursement policy for CAR-T cell therapy?"),
    ("Nurse", "What are the ICU visiting hours for family members?"),
])
def test_r5_unanswerable_question_is_refused(spy, role, q):
    resp = pipeline.run_query(role, q, audit=False)
    assert resp["status"] == "refused" and resp["answer"] is None
    assert resp["refusal"]["missing_terms"], "refusal must state what evidence is missing"
    assert not spy.calls, "no generation may run when evidence is insufficient"


# ---------------------------------------------------------------- R2 / R3 / A3 grounding & citations
def test_r2_r3_citations_resolve_to_retrieved_evidence(spy):
    resp = pipeline.run_query("Billing Specialist", "What formulary tier is meropenem on?", audit=False)
    assert resp["status"] == "answered" and resp["citations"]
    ids = {e["chunk_id"] for e in resp["evidence"]}
    for c in resp["citations"]:
        assert c["chunk_id"] in ids
    top = resp["citations"][0]
    assert top["document_id"] == "DOC-FORM-2025" and top["row_id"] == "ROW-03"
    for claim in resp["claims"]:
        assert claim["citations"] and claim["support"] >= settings.min_claim_support


def test_r3_claim_verifier_removes_unsupported_and_invented_numbers():
    ev = {1: {"content": "Vancomycin maintenance dose is 15 mg/kg IV every 12 hours."}}
    out = synthesizer.verify_claims(
        "Vancomycin maintenance is 15 mg/kg every 12 hours [1]. Vancomycin maintenance is 45 mg/kg every 2 hours [1]. "
        "The moon is made of cheese [1]. Something else [7].", ev)
    kept = [c["text"] for c in out["claims"]]
    assert len(kept) == 1 and "15 mg/kg" in kept[0]
    reasons = " ".join(r["reason"] for r in out["removed_claims"])
    assert "numbers not in cited evidence" in reasons


def test_r3_evidence_endpoint_logic_row_citation():
    c = next(c for c in INDEX.chunks if c["row_id"] == "ROW-01")
    assert c["document_id"] == "DOC-FORM-2025" and "Vancomycin" in c["content"]


# ---------------------------------------------------------------- R8 / A5 evaluation
def test_r8_evaluation_metrics_computed_and_reproducible(spy):
    r1 = evaluator.run_evaluation()
    r2 = evaluator.run_evaluation()
    assert r1["total_questions"] == 15 and r1["completed_questions"] == 15
    for k in ("groundedness", "citation_precision", "conflict_detection", "refusal_accuracy", "pii_leakage"):
        assert k in r1["metrics"]
    assert r1["metrics"] == r2["metrics"]
    assert [x["passed"] for x in r1["per_question_results"]] == [x["passed"] for x in r2["per_question_results"]]
    assert r1["metrics"]["pii_leakage"] == 0
    assert r1["metrics"]["unauthorized_evidence_rate"] == 0
    assert (Path(evaluator.RESULTS_DIR) / "latest.json").exists()


# ---------------------------------------------------------------- API
def test_api_behaviour(spy):
    from urllib.parse import quote
    from fastapi.testclient import TestClient
    import server
    with TestClient(server.app) as client:
        assert client.get("/api/health").json()["database"] is True
        docs = client.get("/api/documents", params={"role": "Billing Specialist"}).json()
        acc = {d["document_id"]: d["accessible"] for d in docs["documents"]}
        assert acc["DOC-AUD-AE-2025"] is False and acc["DOC-FORM-2025"] is True
        r = client.post("/api/query", json={"query": "What formulary tier is meropenem on?", "role": "Billing Specialist"})
        assert r.status_code == 200 and r.json()["citations"]
        assert client.post("/api/query", json={"query": "hello there", "role": "Root"}).status_code == 403
        audit_chunk = next(c["chunk_id"] for c in INDEX.chunks if c["document_id"] == "DOC-AUD-AE-2025")
        assert client.get(f"/api/evidence/{quote(audit_chunk, safe='')}", params={"role": "Billing Specialist"}).status_code == 403
        ok = client.get(f"/api/evidence/{quote(audit_chunk, safe='')}", params={"role": "Compliance Auditor"})
        assert ok.status_code == 200 and "SYN-MRN" not in ok.text
        row = next(c["chunk_id"] for c in INDEX.chunks if c["row_id"] == "ROW-01")
        ev = client.get(f"/api/evidence/{quote(row, safe='')}", params={"role": "Pharmacist"}).json()
        assert ev["row"]["row_id"] == "ROW-01" and len(ev["table"]) == 20
        assert client.get("/api/privacy/status").status_code == 200
