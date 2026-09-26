"""PII / PHI gate.

Deterministic detection + redaction tuned for the synthetic corpus. It runs at:

  1. INGESTION   – structured PII fields and free-text patterns are redacted
                   before anything is chunked, embedded or stored; hashes of
                   the removed values go to `pii_registry`.
  2. QUERY       – the user query is scanned; identifiers are redacted before
                   the query is written to the audit log.
  3. MODEL INPUT – evidence text is re-scanned before it enters the prompt.
  4. OUTPUT      – the final answer is scanned with regex patterns AND against
                   the identifier-hash registry (catches verbatim leakage of
                   known identifiers, e.g. a synthetic patient's surname).

This is NOT a certified clinical de-identification system; it is a
measurable, testable leakage control for this corpus.
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass, field

# Field names that always hold direct identifiers in structured records.
PII_FIELDS = {
    "patient_name": "NAME",
    "name": "NAME",
    "mrn": "MRN",
    "dob": "DOB",
    "date_of_birth": "DOB",
    "phone": "PHONE",
    "email": "EMAIL",
    "address": "ADDRESS",
}

STREET_WORDS = r"(?:Lane|Road|Street|Avenue|Close|Crescent|Drive|Way|Court|Place|Boulevard|Rd|St|Ave)"

PATTERNS: list[tuple[str, re.Pattern]] = [
    ("MRN", re.compile(r"\b(?:SYN-)?MRN[-:#\s]*\d{3,}\b", re.IGNORECASE)),
    ("EMAIL", re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b")),
    ("PHONE", re.compile(r"(?<![\w-])(?:\+?\d{1,2}[\s.-])?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}(?![\w-])")),
    ("DOB", re.compile(r"\b(?:DOB|D\.O\.B\.|date of birth|born(?: on)?)\s*[:\-]?\s*\d{4}-\d{2}-\d{2}\b", re.IGNORECASE)),
    ("DOB", re.compile(r"\b(?:DOB|date of birth)\s*[:\-]?\s*\d{1,2}/\d{1,2}/\d{2,4}\b", re.IGNORECASE)),
    ("ADDRESS", re.compile(rf"\b\d{{1,5}}\s+(?:[A-Z][a-z]+\s+){{1,3}}{STREET_WORDS}\b")),
    ("NAME", re.compile(r"\b(?:patient(?: name)?|pt)\s*[:\-]\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b", re.IGNORECASE)),
]

_TOKEN_RE = re.compile(r"[A-Za-z0-9@._+\-]+")


def _tokens(text: str) -> list[str]:
    return [t.strip(".").lower() for t in _TOKEN_RE.findall(text) if t.strip(".")]


def normalise(value: str) -> str:
    return " ".join(_tokens(value))


def hash_value(value: str) -> str:
    return hashlib.sha256(normalise(value).encode("utf-8")).hexdigest()


@dataclass
class Finding:
    pii_type: str
    source: str  # "pattern" | "field" | "registry"


@dataclass
class ScanResult:
    text: str
    findings: list[Finding] = field(default_factory=list)

    @property
    def count(self) -> int:
        return len(self.findings)

    def by_type(self) -> dict[str, int]:
        out: dict[str, int] = {}
        for f in self.findings:
            out[f.pii_type] = out.get(f.pii_type, 0) + 1
        return out


def redact_text(text: str) -> ScanResult:
    findings: list[Finding] = []
    for pii_type, pattern in PATTERNS:
        def _sub(_m, t=pii_type):
            findings.append(Finding(t, "pattern"))
            return f"[REDACTED-{t}]"
        text = pattern.sub(_sub, text)
    return ScanResult(text, findings)


def registry_entries(pii_type: str, value: str) -> list[tuple[str, str, int]]:
    """Hashes to register for one identifier value. Names also register each
    surname/given-name token so partial leakage is caught."""
    value = str(value)
    entries = [(hash_value(value), pii_type, len(_tokens(value)))]
    if pii_type == "NAME":
        for tok in _tokens(value):
            if len(tok) >= 4:
                entries.append((hash_value(tok), pii_type, 1))
    if pii_type == "ADDRESS" and "," in value:
        street = value.split(",")[0]
        entries.append((hash_value(street), pii_type, len(_tokens(street))))
    if pii_type == "PHONE":
        digits = re.sub(r"\D", "", value)
        entries.append((hash_value(digits), pii_type, 1))
    return entries


def redact_record(record: dict) -> tuple[dict, list[Finding], list[tuple[str, str, int]]]:
    """Redact a structured record. Returns (safe_record, findings, registry)."""
    safe: dict = {}
    findings: list[Finding] = []
    registry: list[tuple[str, str, int]] = []
    for key, value in record.items():
        pii_type = PII_FIELDS.get(key.lower())
        if pii_type and value not in (None, ""):
            findings.append(Finding(pii_type, "field"))
            registry.extend(registry_entries(pii_type, value))
            safe[key] = f"[REDACTED-{pii_type}]"
        elif isinstance(value, str):
            res = redact_text(value)
            findings.extend(res.findings)
            safe[key] = res.text
        else:
            safe[key] = value
    return safe, findings, registry


def scan_against_registry(text: str, registry_hashes: set[str], max_n: int = 5) -> list[tuple[int, int]]:
    """Return token spans whose n-gram hash matches a registered identifier."""
    toks = _tokens(text)
    spans = []
    for n in range(1, max_n + 1):
        for i in range(0, len(toks) - n + 1):
            gram = " ".join(toks[i:i + n])
            if hashlib.sha256(gram.encode("utf-8")).hexdigest() in registry_hashes:
                spans.append((i, i + n))
    return spans


def output_gate(text: str, registry_hashes: set[str]) -> ScanResult:
    """Final privacy gate on generated text: regex redaction + registry match."""
    result = redact_text(text)
    out = result.text
    spans = scan_against_registry(out, registry_hashes)
    if spans:
        bad = set()
        toks_raw = _TOKEN_RE.findall(out)
        for s, e in spans:
            bad.update(t for t in toks_raw[s:e])
            result.findings.append(Finding("REGISTERED_IDENTIFIER", "registry"))
        for tok in sorted(bad, key=len, reverse=True):
            out = re.sub(rf"(?<![\w@.-]){re.escape(tok)}(?![\w@-])", "[REDACTED-ID]", out)
    result.text = out
    return result


def contains_leak(text: str, registry_hashes: set[str]) -> dict:
    """Independent leakage check used by tests and the evaluator (does not
    modify text). Counts regex identifiers and registered identifier hits."""
    pattern_hits = sum(len(p.findall(text)) for _, p in PATTERNS)
    registry_hits = len(scan_against_registry(text, registry_hashes))
    return {"pattern_hits": pattern_hits, "registry_hits": registry_hits,
            "leaked": (pattern_hits + registry_hits) > 0}
