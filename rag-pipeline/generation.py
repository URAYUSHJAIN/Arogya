"""Local generation providers behind one interface.

GENERATION_PROVIDER selects exactly one provider; there is NO silent fallback
and NO cloud provider in this codebase.

  transformers  – local Hugging Face causal LM on CPU (default:
                  Qwen/Qwen2.5-0.5B-Instruct), weights cached locally
  ollama        – a local Ollama daemon; the URL must be localhost
  extractive    – deterministic local composer that assembles cited evidence
                  sentences (no neural generation; fast, used by tests)
"""
from __future__ import annotations

import re
import threading
from abc import ABC, abstractmethod
from urllib.parse import urlparse

from config import settings


class GenerationUnavailable(Exception):
    pass


class GenerationProvider(ABC):
    name: str = "abstract"
    model_name: str = ""

    @abstractmethod
    def generate(self, system: str, user: str, evidence: list[dict], question: str) -> str: ...

    @abstractmethod
    def health_check(self) -> dict: ...


class TransformersProvider(GenerationProvider):
    name = "transformers"

    def __init__(self, model_name: str) -> None:
        self.model_name = model_name
        self._model = None
        self._tok = None
        self._lock = threading.Lock()
        self._error: str | None = None

    def _load(self):
        with self._lock:
            if self._model is None:
                try:
                    import torch
                    from transformers import AutoModelForCausalLM, AutoTokenizer
                    torch.set_num_threads(max(1, (torch.get_num_threads() or 4)))
                    self._tok = AutoTokenizer.from_pretrained(self.model_name)
                    self._model = AutoModelForCausalLM.from_pretrained(
                        self.model_name, torch_dtype=torch.float32)
                    self._model.eval()
                except Exception as exc:  # surfaced via health + query error
                    self._error = f"{type(exc).__name__}: {exc}"
                    raise GenerationUnavailable(self._error) from exc

    def generate(self, system: str, user: str, evidence: list[dict], question: str) -> str:
        import torch
        self._load()
        msgs = [{"role": "system", "content": system}, {"role": "user", "content": user}]
        prompt = self._tok.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
        inputs = self._tok(prompt, return_tensors="pt")
        with torch.inference_mode():
            out = self._model.generate(
                **inputs, max_new_tokens=settings.max_new_tokens, do_sample=False,
                repetition_penalty=1.05, pad_token_id=self._tok.eos_token_id)
        return self._tok.decode(out[0][inputs["input_ids"].shape[1]:], skip_special_tokens=True).strip()

    def health_check(self) -> dict:
        return {"provider": self.name, "model": self.model_name, "loaded": self._model is not None,
                "error": self._error, "local": True}


class OllamaProvider(GenerationProvider):
    name = "ollama"

    def __init__(self, model_name: str, url: str) -> None:
        host = urlparse(url).hostname
        if host not in ("localhost", "127.0.0.1", "::1"):
            raise ValueError("OllamaProvider only accepts a local (localhost) endpoint")
        self.model_name, self.url = model_name, url.rstrip("/")

    def generate(self, system: str, user: str, evidence: list[dict], question: str) -> str:
        import httpx
        try:
            r = httpx.post(f"{self.url}/api/chat", timeout=120, json={
                "model": self.model_name, "stream": False, "options": {"temperature": 0},
                "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]})
            r.raise_for_status()
            return r.json()["message"]["content"].strip()
        except Exception as exc:
            raise GenerationUnavailable(f"Ollama unavailable: {exc}") from exc

    def health_check(self) -> dict:
        import httpx
        try:
            httpx.get(f"{self.url}/api/tags", timeout=3).raise_for_status()
            ok = True
        except Exception:
            ok = False
        return {"provider": self.name, "model": self.model_name, "loaded": ok, "local": True}


_SENT = re.compile(r"(?<=[.;])\s+(?=[A-Z(])|\n(?=[-*]\s)")


def _sentences(ev: dict) -> list[str]:
    """Rows and records are atomic evidence units; prose is re-flowed (markdown
    hard-wraps removed) and split on sentence boundaries."""
    if ev.get("chunk_type") in ("table_row", "json_record"):
        return [ev["content"]]
    text = re.sub(r"\n(?![-*]\s)", " ", ev["content"])
    return _SENT.split(text)
_WORD = re.compile(r"[a-z0-9]+(?:[-/.][a-z0-9]+)*")
_STOP = set("the a an of to and or in on for is are be with by as at what which how does do".split())


class ExtractiveProvider(GenerationProvider):
    """Deterministic, local composer: selects the evidence sentences that best
    cover the question terms and cites each one. Declared, not hidden."""
    name = "extractive"
    model_name = "extractive-sentence-selector"

    def generate(self, system: str, user: str, evidence: list[dict], question: str) -> str:
        q = {w for w in _WORD.findall(question.lower()) if w not in _STOP}
        scored = []
        for n, ev in enumerate(evidence, start=1):
            for sent in _sentences(ev):
                s = sent.strip(" -*")
                if len(s.split()) < 4:
                    continue
                words = set(_WORD.findall(s.lower()))
                overlap = len(q & words)
                if overlap:
                    scored.append((overlap / (1 + 0.02 * len(words)), -n, s, n))
        scored.sort(reverse=True)
        picked, seen = [], set()
        for _, _, s, n in scored:
            if s in seen:
                continue
            seen.add(s)
            picked.append(f"{s.rstrip('.')} [{n}].")
            if len(picked) == 3:
                break
        return " ".join(picked)

    def health_check(self) -> dict:
        return {"provider": self.name, "model": self.model_name, "loaded": True, "local": True}


_provider: GenerationProvider | None = None


def get_provider() -> GenerationProvider:
    global _provider
    if _provider is None:
        p = settings.generation_provider.lower()
        if p == "transformers":
            _provider = TransformersProvider(settings.local_model_name)
        elif p == "ollama":
            _provider = OllamaProvider(settings.local_model_name, settings.ollama_url)
        elif p == "extractive":
            _provider = ExtractiveProvider()
        else:
            raise GenerationUnavailable(
                f"Unknown GENERATION_PROVIDER={p!r}. Allowed: transformers, ollama, extractive")
    return _provider


def set_provider(provider: GenerationProvider | None) -> None:
    """Used by tests to select a provider explicitly."""
    global _provider
    _provider = provider
