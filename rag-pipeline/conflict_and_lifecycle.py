"""Conflict detection and document-lifecycle resolution.

Conflicts are detected from the retrieved evidence itself — never from a
hard-coded list of known disagreements:

1. Extract normative, comparable claims from every evidence passage:
     • regimen claims  – (dose, frequency) pairs for a medication
     • timing claims   – "within N hours/minutes" targets for a subject
2. Subjects come from the query and from a vocabulary built at runtime from
   the ingested formulary table (medication column) + generic clinical nouns.
3. For each (subject, claim kind) asserted by two or more *different*
   documents, disjoint value sets = conflict.
4. Lifecycle metadata (status, version, effective dates, supersedes /
   superseded_by) is attached to each side and an explicit lifecycle
   assessment is produced. The conflict is ALWAYS surfaced, even when
   lifecycle metadata indicates which source is authoritative.
"""
from __future__ import annotations

import re
from datetime import date

import database as db

DOSE_RE = re.compile(
    r"(\d+(?:\.\d+)?)\s*(mg/kg|mcg/kg/min|units/min|million units|mg|g)\b(?!/)", re.IGNORECASE)
FREQ_RE = re.compile(r"\b(?:every\s+(\d+)\s+hours?|q(\d+)h)\b", re.IGNORECASE)
TIMING_RE = re.compile(r"\bwithin\s+(\d+(?:\.\d+)?)\s+(hours?|minutes?|days?)\b", re.IGNORECASE)
SENT_SPLIT = re.compile(r"(?<=[.;])\s+(?=[A-Z])|\n(?=[-*]\s)")
GENERIC_SUBJECTS = {
    "antibiotic": ["antibiotic", "antibiotics", "antimicrobial"],
}


def _norm_dose(value: str, unit: str) -> str:
    v, u = float(value), unit.lower()
    if u == "mg" and v >= 1000 and v % 1000 == 0:
        v, u = v / 1000, "g"
    return f"{v:g} {u}"


def _norm_time(value: str, unit: str) -> str:
    v, u = float(value), unit.lower().rstrip("s")
    if u == "minute" and v % 60 == 0:
        v, u = v / 60, "hour"
    return f"{v:g} {u}"


_vocab_cache: dict[str, list[str]] = {}


def subject_vocabulary(refresh: bool = False) -> dict[str, list[str]]:
    """Medication names from ingested table rows (runtime, not hard-coded)."""
    global _vocab_cache
    if refresh or not _vocab_cache:
        vocab: dict[str, list[str]] = {k: v for k, v in GENERIC_SUBJECTS.items()}
        try:
            rows = db.fetch_all(
                "SELECT DISTINCT cells->>'medication' AS m FROM table_rows WHERE cells ? 'medication'")
        except Exception:
            rows = []
        for r in rows:
            name = (r["m"] or "").strip()
            if name:
                base = re.sub(r"\s+\d.*$", "", name).lower()
                vocab[base] = [base]
        _vocab_cache = vocab
    return _vocab_cache


def _find_subject_mentions(text: str, vocab: dict[str, list[str]]) -> list[tuple[int, str]]:
    low = text.lower()
    out = []
    for subject, aliases in vocab.items():
        for alias in aliases:
            for m in re.finditer(rf"\b{re.escape(alias)}\b", low):
                out.append((m.start(), subject))
    return sorted(out)


def extract_claims(evidence: dict, vocab: dict[str, list[str]]) -> list[dict]:
    claims = []
    for sent in SENT_SPLIT.split(evidence["content"]):
        if not sent.strip():
            continue
        mentions = _find_subject_mentions(sent, vocab)
        # regimen claims: nearest dose preceding each frequency, attributed to
        # the nearest medication mentioned before that dose
        for fm in FREQ_RE.finditer(sent):
            doses = [d for d in DOSE_RE.finditer(sent) if d.end() <= fm.start() and fm.start() - d.end() <= 60]
            if not doses:
                continue
            d = doses[-1]
            subj = [s for pos, s in mentions if pos <= d.start() and s not in GENERIC_SUBJECTS]
            if not subj:
                subj = [s for _, s in _find_subject_mentions(evidence.get("heading_path") or "", vocab)
                        if s not in GENERIC_SUBJECTS]
            if not subj:
                continue
            freq = fm.group(1) or fm.group(2)
            claims.append({
                "subject": subj[-1], "kind": "regimen",
                "value": f"{_norm_dose(d.group(1), d.group(2))} q{int(freq)}h",
                "text": sent.strip(),
            })
        # timing claims
        for tm in TIMING_RE.finditer(sent):
            for pos, s in mentions:
                if s in GENERIC_SUBJECTS:
                    claims.append({"subject": s, "kind": "timing",
                                   "value": _norm_time(tm.group(1), tm.group(2)),
                                   "text": sent.strip()})
                    break
    return claims


def lifecycle_state(ev: dict, today: date | None = None) -> dict:
    today = today or date.today()
    eff_to = ev.get("effective_to")
    expired = bool(eff_to) and date.fromisoformat(str(eff_to)) < today
    status = ev.get("status")
    current = status == "active" and not expired
    return {
        "status": status, "version": ev.get("version"),
        "effective_from": ev.get("effective_from"), "effective_to": eff_to,
        "supersedes": ev.get("supersedes"), "superseded_by": ev.get("superseded_by"),
        "is_current": current,
        "label": ("ACTIVE" if current else "EXPIRED" if expired and status == "active"
                  else (status or "unknown").upper()),
    }


def _relevant_subjects(query: str, evidence: list[dict], vocab) -> set[str]:
    subs = {s for _, s in _find_subject_mentions(query, vocab)}
    if not subs and evidence:
        subs = {s for _, s in _find_subject_mentions(evidence[0]["content"], vocab)}
    return subs


def detect_conflicts(query: str, evidence: list[dict]) -> list[dict]:
    vocab = subject_vocabulary()
    subjects = _relevant_subjects(query, evidence, vocab)
    # (subject, kind) -> document_id -> {values, items}
    table: dict[tuple[str, str], dict[str, dict]] = {}
    for n, ev in enumerate(evidence, start=1):
        for cl in extract_claims(ev, vocab):
            if cl["subject"] not in subjects:
                continue
            slot = table.setdefault((cl["subject"], cl["kind"]), {}).setdefault(
                ev["document_id"], {"values": set(), "claims": [], "evidence": ev, "ref": n})
            slot["values"].add(cl["value"])
            slot["claims"].append(cl)

    conflicts = []
    for (subject, kind), per_doc in table.items():
        docs = list(per_doc.items())
        disagreeing = set()
        for i in range(len(docs)):
            for j in range(i + 1, len(docs)):
                if not (docs[i][1]["values"] & docs[j][1]["values"]):
                    disagreeing.update({docs[i][0], docs[j][0]})
        if not disagreeing:
            continue
        sides = []
        for doc_id, slot in docs:
            if doc_id not in disagreeing:
                continue
            ev = slot["evidence"]
            sides.append({
                "document_id": doc_id, "title": ev["title"], "chunk_id": ev["chunk_id"],
                "evidence_ref": slot["ref"], "section": ev.get("section"),
                "row_id": ev.get("row_id"), "values": sorted(slot["values"]),
                "claim_text": slot["claims"][0]["text"], "lifecycle": lifecycle_state(ev),
            })
        conflicts.append({
            "subject": subject, "kind": kind, "sources": sides,
            "assessment": _assess(sides),
        })
    return conflicts


def _assess(sides: list[dict]) -> dict:
    current = [s for s in sides if s["lifecycle"]["is_current"]]
    stale = [s for s in sides if not s["lifecycle"]["is_current"]]
    notes = []
    for s in stale:
        lc = s["lifecycle"]
        by = f" by {lc['superseded_by']}" if lc.get("superseded_by") else ""
        notes.append(f"{s['document_id']} (v{lc['version']}) is {lc['label']}{by}"
                     + (f"; effective until {lc['effective_to']}" if lc.get("effective_to") else ""))
    if current and stale:
        summary = ("Sources disagree. Lifecycle metadata indicates the active source(s) "
                   f"{', '.join(s['document_id'] for s in current)} take precedence, but the "
                   "disagreement is shown so a reviewer can confirm legacy practice has been retired.")
        resolution = "lifecycle_precedence_suggested"
    elif len(current) > 1:
        summary = ("Two or more ACTIVE sources disagree. No lifecycle rule resolves this; "
                   "escalate to the document owners before acting.")
        resolution = "unresolved_escalate"
    else:
        summary = "Sources disagree and none is currently active; escalate for review."
        resolution = "unresolved_escalate"
    return {"summary": summary, "resolution": resolution, "lifecycle_notes": notes}


def partition_by_lifecycle(evidence: list[dict]) -> tuple[list[dict], list[dict]]:
    current, stale = [], []
    for ev in evidence:
        (current if lifecycle_state(ev)["is_current"] else stale).append(ev)
    return current, stale
