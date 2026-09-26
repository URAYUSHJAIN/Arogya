import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import conflict_and_lifecycle as cl  # noqa: E402
import database as db  # noqa: E402
import generation  # noqa: E402
import ingest  # noqa: E402
import pipeline  # noqa: E402
from retriever import INDEX  # noqa: E402


class SpyProvider(generation.ExtractiveProvider):
    """Deterministic local provider that records every evidence item the
    synthesizer hands to the model — used to prove what reaches model context."""
    name = "spy-extractive"

    def __init__(self):
        self.calls = []

    def generate(self, system, user, evidence, question):
        self.calls.append({"question": question, "evidence": list(evidence), "prompt": user})
        return super().generate(system, user, evidence, question)


@pytest.fixture(scope="session", autouse=True)
def corpus_loaded():
    if not db.ping():
        pytest.exit("PostgreSQL not reachable: set DATABASE_URL in rag-pipeline/.env", returncode=2)
    ingest.bootstrap(force=True)
    INDEX.load()
    pipeline.pii_registry(refresh=True)
    cl.subject_vocabulary(refresh=True)
    yield


@pytest.fixture()
def spy():
    s = SpyProvider()
    generation.set_provider(s)
    yield s
    generation.set_provider(None)
