"""Evidence sufficiency gate — runs BEFORE any generation.

Decision inputs (all computed from authorized, reranked evidence):
  • top cross-encoder relevance score
  • query-term coverage: share of the question's content terms that appear in
    the top evidence passages (catches "retrieved something vaguely related,
    but not what was asked")
If evidence is insufficient the pipeline refuses and reports which terms had
no supporting evidence and which document categories the role cannot see.
"""
from __future__ import annotations

from config import settings
from rbac import CATEGORY_LABELS, UserContext
from retriever import tokenize

GENERIC_TERMS = set("""recommended recommendation policy policies hospital hospital's patient patients adult
adults information tell explain list recorded required require requires need needs long soon quickly much
many best current guideline guidelines document documents describe say says according rule rules used
involving involve involved give given should must happen happens mean means""".split())


def query_terms(query: str) -> list[str]:
    terms = []
    for t in tokenize(query):
        if t in GENERIC_TERMS or (len(t) < 3 and not any(ch.isdigit() for ch in t)):
            continue
        if t not in terms:
            terms.append(t)
    return terms


def _covered(term: str, vocab: set[str]) -> bool:
    if term in vocab:
        return True
    stem = term[:5]
    return len(term) > 5 and any(v.startswith(stem) for v in vocab)


def assess(query: str, ctx: UserContext, evidence: list[dict], stats: dict) -> dict:
    terms = query_terms(query)
    top = max((e["retrieval"]["rerank_score"] or 0.0 for e in evidence), default=0.0)
    vocab: set[str] = set()
    for e in evidence[:3]:
        vocab.update(tokenize(f"{e['title']} {e.get('heading_path') or ''} {e['content']}"))
    covered = [t for t in terms if _covered(t, vocab)]
    missing = [t for t in terms if t not in covered]
    coverage = (len(covered) / len(terms)) if terms else 0.0
    inaccessible = sorted(CATEGORY_LABELS[c] for c in CATEGORY_LABELS if c not in ctx.allowed_categories)

    if stats.get("authorized_chunks", 0) == 0:
        sufficient, reason = False, "no_authorized_documents"
    elif not evidence:
        sufficient, reason = False, "no_evidence_retrieved"
    elif top < settings.min_rerank_score:
        sufficient, reason = False, "evidence_relevance_too_low"
    elif coverage < settings.min_query_coverage and top < settings.strong_rerank_score:
        sufficient, reason = False, "evidence_does_not_cover_question"
    else:
        sufficient, reason = True, "sufficient"

    return {
        "sufficient": sufficient,
        "reason": reason,
        "top_rerank_score": round(top, 4),
        "query_terms": terms,
        "covered_terms": covered,
        "missing_terms": missing,
        "coverage": round(coverage, 3),
        "thresholds": {"min_rerank_score": settings.min_rerank_score,
                       "strong_rerank_score": settings.strong_rerank_score,
                       "min_query_coverage": settings.min_query_coverage},
        "inaccessible_categories": inaccessible,
    }


REASON_TEXT = {
    "no_authorized_documents": "No documents are authorized for your role.",
    "no_evidence_retrieved": "No authorized evidence matched the question.",
    "evidence_relevance_too_low": "The closest authorized evidence is not relevant enough to answer the question.",
    "evidence_does_not_cover_question": "Authorized evidence was found, but it does not address key parts of the question.",
}


def refusal_message(query: str, ctx: UserContext, suff: dict, stats: dict, evidence: list[dict]) -> dict:
    searched = stats.get("authorized_documents", [])
    missing = suff["missing_terms"]
    lines = [
        "I cannot answer this from the evidence available to your role. No unsupported answer was generated.",
        REASON_TEXT.get(suff["reason"], ""),
    ]
    if missing:
        lines.append("Missing evidence: no authorized source addresses " +
                     ", ".join(f"'{m}'" for m in missing[:8]) + ".")
    if suff["inaccessible_categories"]:
        lines.append("Your role (" + ctx.role + ") cannot search: " +
                     ", ".join(suff["inaccessible_categories"]) +
                     ". If the answer may be in those sources, escalate to a role with access "
                     "(e.g., Compliance Auditor) or the document owner.")
    else:
        lines.append("Escalate to the relevant document owner if this information should exist.")
    return {
        "reason": suff["reason"],
        "message": " ".join(l for l in lines if l),
        "missing_terms": missing,
        "searched_documents": searched,
        "closest_evidence": [
            {"chunk_id": e["chunk_id"], "document_id": e["document_id"],
             "rerank_score": e["retrieval"]["rerank_score"]} for e in evidence[:3]],
        "escalation": {
            "recommended": True,
            "route": ("Compliance Auditor / document owner" if suff["inaccessible_categories"]
                      else "Document owner / clinical governance"),
        },
    }
