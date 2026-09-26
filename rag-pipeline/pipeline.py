"""End-to-end query pipeline (evidence before generation).

validate role → build synthetic user context (from PostgreSQL grants)
→ query privacy scan → permission-aware hybrid retrieval → evidence selection
→ lifecycle partition + conflict detection → sufficiency gate
→ grounded synthesis (authorized evidence only) → claim/citation verification
→ output privacy gate → audit event → response
"""
from __future__ import annotations

import time
import uuid

import conflict_and_lifecycle as cl
import database as db
import generation
import privacy
import rbac
import sufficiency
import synthesizer
from config import settings
from retriever import INDEX

_registry_cache: set[str] | None = None


def pii_registry(refresh: bool = False) -> set[str]:
    global _registry_cache
    if refresh or _registry_cache is None:
        _registry_cache = {r["value_hash"] for r in db.fetch_all("SELECT value_hash FROM pii_registry")}
    return _registry_cache


def select_context(candidates) -> list[dict]:
    evidence = [c.to_evidence() for c in candidates]
    if not evidence:
        return []
    top = evidence[0]["retrieval"]["rerank_score"] or 0.0
    floor = max(settings.evidence_keep_ratio, top * 0.15)
    keep = [e for i, e in enumerate(evidence)
            if i < 2 or (e["retrieval"]["rerank_score"] or 0) >= floor]
    return keep[: settings.context_top_k]


def _public_evidence(n: int, ev: dict, registry: set[str]) -> dict:
    out = dict(ev)
    out["ref"] = n
    out["content"] = privacy.output_gate(ev["content"], registry).text
    out["lifecycle"] = cl.lifecycle_state(ev)
    return out


def run_query(role: str | None, query: str, audit: bool = True, trace: dict | None = None) -> dict:
    t0 = time.perf_counter()
    trace_id = str(uuid.uuid4())
    ctx = rbac.build_user_context(role)  # raises AuthorizationError for unknown roles
    query = (query or "").strip()
    if not query:
        raise ValueError("Query is empty")
    q_scan = privacy.redact_text(query)
    registry = pii_registry()

    retrieval = INDEX.retrieve(ctx, query)
    stats = retrieval["stats"]
    context = select_context(retrieval["candidates"])
    rbac.assert_authorized(ctx, context)  # defence in depth
    numbered = list(enumerate(context, start=1))

    conflicts = cl.detect_conflicts(query, context)
    current, stale = cl.partition_by_lifecycle(context)
    suff = sufficiency.assess(query, ctx, context, stats)

    answer, refusal, synth, claims = None, None, None, []
    lifecycle_warning = None
    status = "refused"
    if suff["sufficient"]:
        answer_evidence = [(n, ev) for n, ev in numbered if ev in current] or \
                          [(n, ev) for n, ev in numbered if ev in stale]
        if not any(ev in current for _, ev in answer_evidence):
            lifecycle_warning = ("Only superseded / retired evidence matched this question. "
                                 "The answer below reflects legacy documents and must be reviewed.")
        try:
            synth = synthesizer.synthesize(ctx, query, answer_evidence)
        except generation.GenerationUnavailable as exc:
            status = "generation_unavailable"
            refusal = {"reason": "generation_unavailable",
                       "message": f"The local generation provider is unavailable ({exc}). "
                                  "Evidence was retrieved but no answer was generated.",
                       "missing_terms": [], "searched_documents": stats["authorized_documents"],
                       "closest_evidence": [], "escalation": {"recommended": False, "route": None}}
        if synth is not None:
            claims = synth["verification"]["claims"]
            if synth["model_declined"] or not claims:
                status = "refused"
                refusal = {
                    "reason": "no_verifiable_claims" if not synth["model_declined"] else "model_declined",
                    "message": ("Relevant evidence was retrieved, but no answer sentence could be verified "
                                "against it, so nothing was stated. Review the evidence directly or "
                                "escalate to the document owner."),
                    "missing_terms": suff["missing_terms"],
                    "searched_documents": stats["authorized_documents"],
                    "closest_evidence": [{"chunk_id": e["chunk_id"], "document_id": e["document_id"],
                                          "rerank_score": e["retrieval"]["rerank_score"]} for e in context[:3]],
                    "escalation": {"recommended": True, "route": "Document owner / clinical governance"},
                }
            else:
                status = "answered_with_conflict" if conflicts else "answered"
                answer = synthesizer.render_answer(claims)
    else:
        refusal = sufficiency.refusal_message(query, ctx, suff, stats, context)

    # Final output privacy gate (answer + every string we return from evidence)
    pre_gate_leak = privacy.contains_leak(answer or "", registry)
    out_scan = privacy.output_gate(answer or "", registry)
    if answer is not None:
        answer = out_scan.text
        for c in claims:
            c["text"] = privacy.output_gate(c["text"], registry).text
    post_gate_leak = privacy.contains_leak(answer or "", registry)

    cited = sorted({n for c in claims for n in c["citations"]})
    citations = [
        {"ref": n, "chunk_id": context[n - 1]["chunk_id"], "document_id": context[n - 1]["document_id"],
         "title": context[n - 1]["title"], "version": context[n - 1]["version"],
         "status": context[n - 1]["status"], "section": context[n - 1]["section"],
         "section_title": context[n - 1]["section_title"], "row_id": context[n - 1]["row_id"],
         "record_id": context[n - 1]["record_id"], "table_id": context[n - 1]["table_id"],
         "chunk_type": context[n - 1]["chunk_type"],
         "rerank_score": context[n - 1]["retrieval"]["rerank_score"]}
        for n in cited]
    evidence_out = [_public_evidence(n, ev, registry) for n, ev in numbered]
    for c in conflicts:
        for s in c["sources"]:
            s["claim_text"] = privacy.output_gate(s["claim_text"], registry).text

    privacy_report = {
        "query_identifiers_redacted": q_scan.count,
        "model_input_redactions": (synth or {}).get("generation", {}).get("model_input_redactions", 0),
        "output_identifiers_blocked": out_scan.count,
        "pre_gate_leak": pre_gate_leak["leaked"],
        "leak_detected_in_delivered_answer": post_gate_leak["leaked"],
    }
    elapsed = round((time.perf_counter() - t0) * 1000)
    response = {
        "trace_id": trace_id,
        "status": status,
        "role": ctx.role,
        "query": q_scan.text,
        "answer": answer,
        "claims": claims,
        "citations": citations,
        "conflicts": conflicts,
        "lifecycle_warning": lifecycle_warning,
        "refusal": refusal,
        "sufficiency": suff,
        "evidence": evidence_out,
        "retrieval": {**stats, "context_chunks": len(context)},
        "generation": (synth or {}).get("generation"),
        "verification": {k: v for k, v in (synth or {}).get("verification", {}).items() if k != "claims"}
        if synth else None,
        "privacy": privacy_report,
        "latency_ms": elapsed,
    }
    if trace is not None:  # used by tests/evaluator to inspect the model context
        trace["context_chunk_ids"] = (synth or {}).get("context_chunk_ids", [])
        trace["context_document_ids"] = sorted({c.split("#")[0] for c in trace["context_chunk_ids"]})
        trace["retrieved_document_ids"] = sorted({e["document_id"] for e in context})
        trace["draft"] = (synth or {}).get("draft")
    if audit:
        record_audit(ctx.role, response, (synth or {}).get("context_chunk_ids", []))
    return response


def record_audit(role: str, resp: dict, context_chunk_ids: list[str]) -> None:
    with db.transaction() as conn:
        conn.execute(
            """INSERT INTO audit_events (id, event_type, role, query_redacted, status,
                   authorized_document_ids, retrieved_document_ids, context_chunk_ids, citation_ids,
                   conflict_detected, sufficiency, privacy, details)
               VALUES (%s,'query',%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (resp["trace_id"], role, resp["query"], resp["status"],
             resp["retrieval"]["authorized_documents"],
             sorted({e["document_id"] for e in resp["evidence"]}),
             context_chunk_ids, [c["chunk_id"] for c in resp["citations"]],
             bool(resp["conflicts"]),
             db.jsonb({k: resp["sufficiency"][k] for k in ("sufficient", "reason", "top_rerank_score", "coverage")}),
             db.jsonb(resp["privacy"]),
             db.jsonb({"latency_ms": resp["latency_ms"], "generation": resp["generation"],
                       "removed_claims": len((resp["verification"] or {}).get("removed_claims", []))})),
        )
