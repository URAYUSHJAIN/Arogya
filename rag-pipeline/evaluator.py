"""Reproducible benchmark runner.

Every question in corpus/eval_questions.json is executed through the real
pipeline (pipeline.run_query) with its role. Metrics are computed from the
returned responses and from an independent re-check of authorization and
privacy; nothing is hand-assigned.

Metric definitions
  groundedness        supported generator-draft claims / all generator-draft claims
                      (answered questions; a claim is supported when the claim
                      verifier finds its content and numbers in the cited passages)
  citation_precision  citations pointing to a gold evidence document / all citations
  conflict_detection  conflict questions where a conflict between the expected
                      documents was surfaced / conflict questions
  refusal_accuracy    questions whose answer-vs-refuse decision matched the
                      expected outcome / questions with a defined expected outcome
  pii_leakage         responses whose full JSON payload contains a registered
                      identifier or PII pattern / all responses
  unauthorized_evidence_rate
                      responses whose evidence or model context contains a chunk
                      from a document the role may not read / all responses

Usage: python evaluator.py      (writes evaluation/results/latest.json)
"""
from __future__ import annotations

import json
import time
from datetime import datetime, timezone
from pathlib import Path

import database as db
import pipeline
import privacy
import rbac
from config import settings

QUESTIONS_FILE = settings.corpus_dir / "eval_questions.json"
RESULTS_DIR = Path(__file__).resolve().parent.parent / "evaluation" / "results"


def load_questions() -> list[dict]:
    return json.loads(QUESTIONS_FILE.read_text(encoding="utf-8"))["questions"]


def sync_questions() -> None:
    with db.transaction() as conn:
        for q in load_questions():
            conn.execute(
                """INSERT INTO evaluation_questions (id, category, role, question, expected)
                   VALUES (%s,%s,%s,%s,%s) ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category,
                   role = EXCLUDED.role, question = EXCLUDED.question, expected = EXCLUDED.expected""",
                (q["id"], q["category"], q["role"], q["question"], db.jsonb(q["expected"])))


def _ratio(num: int, den: int) -> float | None:
    return round(num / den, 4) if den else None


def evaluate_one(q: dict, registry: set[str]) -> dict:
    exp = q["expected"]
    trace: dict = {}
    t0 = time.perf_counter()
    resp = pipeline.run_query(q["role"], q["question"], audit=True, trace=trace)
    ctx = rbac.build_user_context(q["role"])
    answered = resp["status"] in ("answered", "answered_with_conflict")
    checks: dict[str, dict] = {}

    # 1. answer vs refuse decision
    if exp["outcome"] != "any":
        want_answer = exp["outcome"] == "answer"
        checks["outcome"] = {"passed": answered == want_answer,
                             "detail": f"expected {exp['outcome']}, got {resp['status']}"}

    # 2. authorization — independently recomputed from PostgreSQL grants
    exposed = {e["document_id"] for e in resp["evidence"]} | set(trace.get("context_document_ids", []))
    unauthorized = sorted(d for d in exposed if d not in ctx.allowed_document_ids)
    forbidden = sorted(d for d in exposed if d in set(exp.get("forbidden_documents", [])))
    checks["authorization"] = {"passed": not unauthorized and not forbidden,
                               "detail": f"unauthorized={unauthorized} forbidden={forbidden}"}

    # 3. privacy — scan the entire delivered payload
    payload = json.dumps({k: resp[k] for k in ("answer", "claims", "citations", "conflicts",
                                                "refusal", "evidence")}, default=str)
    leak = privacy.contains_leak(payload, registry)
    checks["privacy"] = {"passed": not leak["leaked"], "detail": leak}

    # 4. conflict surfacing
    conflict_docs = {s["document_id"] for c in resp["conflicts"] for s in c["sources"]}
    if exp.get("conflict"):
        need = set(exp.get("conflict_documents", []))
        checks["conflict"] = {"passed": bool(resp["conflicts"]) and need <= conflict_docs,
                              "detail": f"surfaced={sorted(conflict_docs)} expected={sorted(need)}"}
    else:
        checks["no_false_conflict"] = {"passed": not resp["conflicts"],
                                       "detail": f"surfaced={sorted(conflict_docs)}"}

    # 5. citations → gold documents
    gold = set(exp.get("evidence_documents", []))
    cited_docs = [c["document_id"] for c in resp["citations"]]
    correct_cites = sum(1 for d in cited_docs if d in gold)
    if answered:
        checks["citations"] = {"passed": bool(cited_docs) and correct_cites == len(cited_docs),
                               "detail": f"cited={cited_docs} gold={sorted(gold)}"}
        groups = exp.get("required_documents_any", [])
        ctx_docs = {e["document_id"] for e in resp["evidence"]}
        if groups:
            checks["evidence_recall"] = {"passed": all(set(g) & ctx_docs for g in groups),
                                         "detail": f"retrieved={sorted(ctx_docs)} required={groups}"}
        if exp.get("must_mention_any"):
            text = (resp["answer"] or "").lower()
            hit = [m for m in exp["must_mention_any"] if m.lower() in text]
            checks["answer_content"] = {"passed": bool(hit), "detail": f"mentioned={hit}"}

    ver = resp.get("verification") or {}
    return {
        "question_id": q["id"], "category": q["category"], "role": q["role"], "question": q["question"],
        "passed": all(c["passed"] for c in checks.values()),
        "status": resp["status"], "checks": checks,
        "answer": resp["answer"], "refusal_reason": (resp["refusal"] or {}).get("reason"),
        "citations": [{"ref": c["ref"], "chunk_id": c["chunk_id"], "document_id": c["document_id"]}
                      for c in resp["citations"]],
        "conflicts": [{"subject": c["subject"], "kind": c["kind"],
                       "documents": [s["document_id"] for s in c["sources"]]} for c in resp["conflicts"]],
        "top_rerank_score": resp["sufficiency"]["top_rerank_score"],
        "coverage": resp["sufficiency"]["coverage"],
        "generator_claims_total": ver.get("generator_claims_total", 0),
        "generator_claims_supported": ver.get("generator_claims_supported", 0),
        "generation_mode": (resp.get("generation") or {}).get("mode"),
        "cited_total": len(cited_docs), "cited_correct": correct_cites,
        "unauthorized_exposure": bool(unauthorized), "pii_leak": leak["leaked"],
        "trace_id": resp["trace_id"], "latency_ms": round((time.perf_counter() - t0) * 1000),
    }


def compute_metrics(results: list[dict], questions: list[dict]) -> dict:
    expected = {q["id"]: q["expected"] for q in questions}
    gen_total = sum(r["generator_claims_total"] for r in results)
    gen_ok = sum(r["generator_claims_supported"] for r in results)
    cites = sum(r["cited_total"] for r in results)
    cites_ok = sum(r["cited_correct"] for r in results)
    conflict_rs = [r for r in results if expected[r["question_id"]].get("conflict")]
    non_conflict = [r for r in results if not expected[r["question_id"]].get("conflict")]
    decided = [r for r in results if "outcome" in r["checks"]]
    return {
        "groundedness": _ratio(gen_ok, gen_total),
        "citation_precision": _ratio(cites_ok, cites),
        "conflict_detection": _ratio(sum(r["checks"]["conflict"]["passed"] for r in conflict_rs), len(conflict_rs)),
        "conflict_false_positive_rate": _ratio(sum(not r["checks"]["no_false_conflict"]["passed"] for r in non_conflict), len(non_conflict)),
        "refusal_accuracy": _ratio(sum(r["checks"]["outcome"]["passed"] for r in decided), len(decided)),
        "pii_leakage": _ratio(sum(r["pii_leak"] for r in results), len(results)),
        "unauthorized_evidence_rate": _ratio(sum(r["unauthorized_exposure"] for r in results), len(results)),
        "pass_rate": _ratio(sum(r["passed"] for r in results), len(results)),
        "counts": {"generator_claims": gen_total, "supported_generator_claims": gen_ok,
                   "citations": cites, "correct_citations": cites_ok},
    }


def run_evaluation() -> dict:
    questions = load_questions()
    sync_questions()
    registry = pipeline.pii_registry(refresh=True)
    started = datetime.now(timezone.utc)
    with db.transaction() as conn:
        run_id = conn.execute(
            "INSERT INTO evaluation_runs (started_at, total_questions, config) VALUES (%s,%s,%s) RETURNING id",
            (started, len(questions), db.jsonb(_config()))).fetchone()["id"]
    results = []
    for q in questions:
        try:
            results.append(evaluate_one(q, registry))
        except Exception as exc:  # a crash is a failed case, never a skipped one
            results.append({"question_id": q["id"], "category": q["category"], "role": q["role"],
                            "question": q["question"], "passed": False, "status": "error",
                            "checks": {"execution": {"passed": False, "detail": repr(exc)}},
                            "generator_claims_total": 0, "generator_claims_supported": 0,
                            "cited_total": 0, "cited_correct": 0, "unauthorized_exposure": False,
                            "pii_leak": False})
    metrics = compute_metrics(results, questions)
    finished = datetime.now(timezone.utc)
    categories: dict[str, dict] = {}
    for r in results:
        c = categories.setdefault(r["category"], {"total": 0, "passed": 0})
        c["total"] += 1
        c["passed"] += int(r["passed"])
    with db.transaction() as conn:
        conn.execute(
            """UPDATE evaluation_runs SET finished_at=%s, completed_questions=%s, passed=%s, metrics=%s
               WHERE id=%s""",
            (finished, len(results), sum(r["passed"] for r in results),
             db.jsonb({**metrics, "categories": categories}), run_id))
        for r in results:
            conn.execute(
                """INSERT INTO evaluation_results (run_id, question_id, passed, status, checks, details)
                   VALUES (%s,%s,%s,%s,%s,%s)""",
                (run_id, r["question_id"], r["passed"], r["status"], db.jsonb(r["checks"]), db.jsonb(r)))
    report = {
        "run_id": str(run_id), "timestamp": finished.isoformat(),
        "duration_s": round((finished - started).total_seconds(), 1),
        "total_questions": len(questions), "completed_questions": len(results),
        "passed": sum(r["passed"] for r in results), "failed": sum(not r["passed"] for r in results),
        "metrics": metrics, "categories": categories, "config": _config(),
        "per_question_results": results,
    }
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    (RESULTS_DIR / "latest.json").write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")
    return report


def _config() -> dict:
    import generation
    try:
        gen = generation.get_provider()
        gen_desc = {"provider": gen.name, "model": gen.model_name}
    except Exception as exc:
        gen_desc = {"provider": settings.generation_provider, "error": str(exc)}
    return {"embedding_model": settings.embedding_model, "reranker_model": settings.reranker_model,
            "generation": gen_desc, "min_rerank_score": settings.min_rerank_score,
            "strong_rerank_score": settings.strong_rerank_score,
            "min_query_coverage": settings.min_query_coverage, "context_top_k": settings.context_top_k}


def latest_run(summary_only: bool = False) -> dict | None:
    run = db.fetch_one(
        "SELECT * FROM evaluation_runs WHERE finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 1")
    if not run:
        return None
    out = {"run_id": str(run["id"]), "timestamp": run["finished_at"].isoformat(),
           "total_questions": run["total_questions"], "completed_questions": run["completed_questions"],
           "passed": run["passed"], "failed": (run["completed_questions"] or 0) - (run["passed"] or 0),
           "metrics": {k: v for k, v in (run["metrics"] or {}).items() if k != "categories"},
           "categories": (run["metrics"] or {}).get("categories", {}), "config": run["config"]}
    if not summary_only:
        rows = db.fetch_all("SELECT details FROM evaluation_results WHERE run_id = %s ORDER BY question_id",
                            (run["id"],))
        out["per_question_results"] = [r["details"] for r in rows]
    return out


if __name__ == "__main__":
    import ingest
    from retriever import INDEX
    ingest.bootstrap()
    INDEX.load()
    rep = run_evaluation()
    print(json.dumps({k: rep[k] for k in ("run_id", "passed", "failed", "metrics", "categories")}, indent=2))
    for r in rep["per_question_results"]:
        fails = {k: v["detail"] for k, v in r["checks"].items() if not v["passed"]}
        print(f"{r['question_id']} {'PASS' if r['passed'] else 'FAIL'} {r['status']:<24} {fails if fails else ''}")
