"""Grounded synthesis + claim-level citation verification.

The synthesizer receives ONLY authorized evidence (re-checked here with
rbac.assert_authorized). The generator is instructed to cite, but citations
are not trusted: every sentence is verified by application code.

A claim is kept only if:
  • it cites evidence numbers that were actually supplied, and
  • its content words are supported by the cited passages
    (overlap ≥ MIN_CLAIM_SUPPORT), and
  • every number in the claim appears in the cited passages
    (blocks invented doses, durations and thresholds).
Uncited sentences are attributed to the single best-supporting passage only
if they pass the same test; otherwise they are removed and reported.
"""
from __future__ import annotations

import re

import generation
import privacy
import rbac
from config import settings
from retriever import tokenize

SYSTEM_PROMPT = """You are Arogya, an evidence-bound assistant for a hospital's clinical and operations staff.
Rules (mandatory):
1. Use ONLY the numbered evidence passages provided. Never use outside knowledge.
2. Every sentence must end with the number of the passage that supports it, e.g. [1] or [2].
3. Copy doses, numbers, codes and time limits exactly as written in the evidence.
4. Do not cite a number that was not supplied. Do not invent facts.
5. If the evidence does not answer the question, reply exactly: INSUFFICIENT EVIDENCE.
6. Answer in at most 4 short sentences. No preamble."""

_NUM_RE = re.compile(r"\d+(?:\.\d+)?")
_CITE_RE = re.compile(r"\[(\d+(?:\s*,\s*\d+)*)\]")
_SENT_RE = re.compile(r"(?<=[.!?])\s+(?=[A-Z0-9\[(])|\n+")
_FILLER = set("""answer according evidence passage passages source sources states state stated indicates
note based provided following also however therefore thus""".split())


def evidence_header(n: int, ev: dict) -> str:
    loc = []
    if ev.get("section"):
        loc.append(f"section {ev['section']}")
    if ev.get("row_id"):
        loc.append(f"row {ev['row_id']}")
    if ev.get("record_id"):
        loc.append(f"record {ev['record_id']}")
    return (f"[{n}] {ev['title']} (doc {ev['document_id']}, v{ev['version']}, {ev['status']}"
            + (f", {', '.join(loc)}" if loc else "") + ")")


_HEADER_ECHO = re.compile(r"^\s*\[\d+\][^\n]*\(doc DOC-[^)]*\)\s*$", re.MULTILINE)


def reflow(text: str) -> str:
    """Join markdown hard-wrapped lines; keep list items on their own lines."""
    return re.sub(r"\n(?!\s*(?:[-*•]|\d+\.)\s)", " ", text)


def build_prompt(question: str, numbered: list[tuple[int, dict]]) -> tuple[str, int]:
    """Model-input privacy gate is applied to every passage here."""
    blocks, redactions = [], 0
    for n, ev in numbered:
        scan = privacy.redact_text(reflow(ev["content"]))
        redactions += scan.count
        blocks.append(f"{evidence_header(n, ev)}\n{scan.text}")
    user = ("Evidence passages:\n\n" + "\n\n".join(blocks) +
            f"\n\nQuestion: {question}\n\nWrite the answer in complete sentences using only the evidence. "
            "End each sentence with its passage number in brackets.\nAnswer:")
    return user, redactions


def _content_words(text: str) -> set[str]:
    return {t for t in tokenize(_CITE_RE.sub(" ", text)) if t not in _FILLER and not _NUM_RE.fullmatch(t)}


def _numbers(text: str) -> set[str]:
    return set(_NUM_RE.findall(_CITE_RE.sub(" ", text)))


def split_claims(text: str) -> list[str]:
    text = _HEADER_ECHO.sub("", text)
    text = reflow(re.sub(r"^\s*(answer|response)\s*:\s*", "", text.strip(), flags=re.IGNORECASE))
    parts = [p.strip(" -*•\t") for p in _SENT_RE.split(text)]
    return [p for p in parts if len(_content_words(p)) >= 2 or _CITE_RE.search(p)]


def support(claim: str, passages: list[str]) -> tuple[float, list[str]]:
    words = _content_words(claim)
    if not words:
        return 0.0, []
    ev_words: set[str] = set()
    ev_nums: set[str] = set()
    for p in passages:
        ev_words |= set(tokenize(p))
        ev_nums |= _numbers(p)
    overlap = len(words & ev_words) / len(words)
    missing_numbers = sorted(_numbers(claim) - ev_nums)
    return overlap, missing_numbers


def verify_claims(draft: str, numbered: dict[int, dict]) -> dict:
    kept, removed = [], []
    for claim in split_claims(draft):
        cited = sorted({int(x) for grp in _CITE_RE.findall(claim) for x in grp.split(",")})
        valid = [n for n in cited if n in numbered]
        invalid = [n for n in cited if n not in numbered]
        attributed = False
        if not valid:
            # try to attribute an uncited sentence to its best-supporting passage
            best = max(numbered, key=lambda n: support(claim, [numbered[n]["content"]])[0], default=None)
            if best is not None:
                valid, attributed = [best], True
        score, missing_nums = support(claim, [numbered[n]["content"] for n in valid]) if valid else (0.0, [])
        ok = bool(valid) and score >= settings.min_claim_support and not missing_nums
        record = {
            "text": _CITE_RE.sub("", claim).strip(), "citations": valid,
            "invalid_citations": invalid, "support": round(score, 3),
            "unsupported_numbers": missing_nums, "auto_attributed": attributed,
        }
        if ok:
            kept.append(record)
        else:
            record["reason"] = ("no valid citation" if not valid else
                                f"numbers not in cited evidence: {missing_nums}" if missing_nums else
                                f"support {score:.2f} < {settings.min_claim_support}")
            removed.append(record)
    total = len(kept) + len(removed)
    return {"claims": kept, "removed_claims": removed, "total_draft_claims": total,
            "draft_groundedness": (len(kept) / total) if total else None}


def synthesize(ctx: rbac.UserContext, question: str, answer_evidence: list[tuple[int, dict]]) -> dict:
    """Generate + verify. `answer_evidence` = [(global_ref_number, evidence)]."""
    rbac.assert_authorized(ctx, [ev for _, ev in answer_evidence])  # security invariant S1
    provider = generation.get_provider()
    user_prompt, input_redactions = build_prompt(question, answer_evidence)
    numbered = dict(answer_evidence)
    evs = [ev for _, ev in answer_evidence]

    mode, fallback_reason = provider.name, None
    draft = provider.generate(SYSTEM_PROMPT, user_prompt, evs, question)
    if draft.strip().upper().startswith("INSUFFICIENT EVIDENCE"):
        verification = {"claims": [], "removed_claims": [], "total_draft_claims": 0,
                        "draft_groundedness": None}
        return {"model_declined": True, "draft": draft, "verification": verification,
                "generation": {"provider": provider.name, "model": provider.model_name,
                               "mode": mode, "fallback_reason": None,
                               "model_input_redactions": input_redactions},
                "context_chunk_ids": [ev["chunk_id"] for ev in evs]}

    verification = verify_claims(draft, numbered)
    verification["generator_claims_total"] = verification["total_draft_claims"]
    verification["generator_claims_supported"] = len(verification["claims"])
    if not verification["claims"] and provider.name != "extractive":
        # Declared (never silent) local fallback: the generator's draft failed
        # verification, so compose verified evidence sentences instead.
        fallback_reason = "generator draft failed claim verification"
        mode = "extractive_fallback"
        ex = generation.ExtractiveProvider()
        remap = {i + 1: n for i, (n, _) in enumerate(answer_evidence)}
        ex_draft = _CITE_RE.sub(lambda m: f"[{remap[int(m.group(1))]}]",
                                ex.generate(SYSTEM_PROMPT, user_prompt, evs, question))
        ex_ver = verify_claims(ex_draft, numbered)
        ex_ver["draft_groundedness"] = verification["draft_groundedness"]
        ex_ver["removed_claims"] = verification["removed_claims"] + ex_ver["removed_claims"]
        ex_ver["total_draft_claims"] = verification["total_draft_claims"]
        ex_ver["generator_claims_total"] = verification["generator_claims_total"]
        ex_ver["generator_claims_supported"] = 0
        verification = ex_ver

    return {
        "model_declined": False, "draft": draft, "verification": verification,
        "generation": {"provider": provider.name, "model": provider.model_name, "mode": mode,
                       "fallback_reason": fallback_reason, "model_input_redactions": input_redactions},
        "context_chunk_ids": [ev["chunk_id"] for ev in evs],
    }


def render_answer(claims: list[dict]) -> str:
    return " ".join(
        f"{c['text'].rstrip('.')}" + "".join(f" [{n}]" for n in c["citations"]) + "."
        for c in claims)
