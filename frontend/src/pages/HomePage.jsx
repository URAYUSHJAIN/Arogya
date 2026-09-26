import { Link } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';

const PROBLEMS = [
  { t: 'Fragmented knowledge', d: 'Guidelines, SOPs, formularies, payer policies, device manuals and audit records live in different formats and owners.' },
  { t: 'Conflicting versions', d: 'A 2021 SOP and a 2025 guideline can prescribe different regimens. Silent selection is a patient-safety risk.' },
  { t: 'Access boundaries', d: 'A billing specialist must not retrieve restricted adverse-event records — enforced in retrieval, not hidden in the UI.' },
  { t: 'Evidence or nothing', d: 'In healthcare a confident wrong answer costs more than no answer. Unsupported questions are refused.' },
];

const STAGES = [
  ['Ingestion', 'Markdown · CSV · JSON parsers, heading-aware and row/record-atomic chunking with provenance'],
  ['Privacy', 'PII/PHI redaction at ingestion, model input and output; identifier-hash leak detection'],
  ['RBAC', 'Role → category grants in PostgreSQL; unauthorized chunks are never scored'],
  ['Hybrid Retrieval', 'BM25 (rank_bm25) + dense MiniLM embeddings, fused with Reciprocal Rank Fusion'],
  ['Reranking', 'BAAI/bge-reranker-base cross-encoder scores every fused candidate'],
  ['Conflict Resolution', 'Regimen/timing claims compared across documents; lifecycle status attached'],
  ['Grounded Synthesis', 'Local LLM sees only authorized evidence; every sentence is citation-verified'],
  ['Audit & Evaluation', 'Every query audited; 15-question benchmark computes metrics from live runs'],
];

const HomePage = () => {
  const { corpus, privacy } = useWorkspace();
  return (
    <div className="bg-[#FDFCF9]">
      <section className="mx-auto max-w-6xl px-4 pb-10 pt-14 text-center">
        <span className="rounded-full border border-[#C8DFC9] bg-[#E8F2E9] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#3D6B4F]">
          Escape Velocity · Track P-02 · Healthcare Greenfield Enterprise RAG
        </span>
        <h1 className="mt-6 text-5xl font-bold text-[#1E3A28] md:text-6xl">Arogya</h1>
        <p className="mt-2 font-['Playfair_Display'] text-2xl text-[#3D6B4F]">Evidence-Before-Generation Engine</p>
        <p className="mx-auto mt-5 max-w-2xl text-[#2A4A35]/80">
          Arogya does not optimise for an answer. It optimises for an answer that can prove why it is
          allowed to exist — authorized evidence, surfaced conflicts, verified citations, or a refusal
          that says exactly what is missing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/ai-analysis" className="rounded-xl bg-[#2A4A35] px-6 py-3 font-semibold text-white shadow-sm hover:bg-[#1E3A28]">
            Open Clinical Auditor
          </Link>
          <Link to="/emergency" className="rounded-xl border border-[#A8C5AE] bg-white px-6 py-3 font-semibold text-[#2A4A35] hover:bg-[#E8F2E9]">
            Evaluation Dashboard
          </Link>
        </div>
        <p className="mt-4 text-xs text-[#6B8F71]">
          Live corpus: {corpus ? `${corpus.total} documents (${corpus.active} active)` : 'backend not connected'}
          {privacy ? ` · ${privacy.ingestion_redactions} identifiers redacted at ingestion` : ''}
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-12 md:grid-cols-4">
        {PROBLEMS.map((p) => (
          <div key={p.t} className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#1E3A28]">{p.t}</h3>
            <p className="mt-2 text-sm text-[#2A4A35]/75">{p.d}</p>
          </div>
        ))}
      </section>

      <section className="border-y border-green-100 bg-[#F5F3EE] py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-[#1E3A28]">The pipeline every question passes through</h2>
          <ol className="mt-8 grid gap-3 md:grid-cols-4">
            {STAGES.map(([t, d], i) => (
              <li key={t} className="relative rounded-2xl border border-[#C8DFC9] bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3D6B4F] text-xs font-bold text-white">{i + 1}</span>
                  <span className="font-semibold text-[#1E3A28]">{t}</span>
                </div>
                <p className="mt-2 text-xs text-[#2A4A35]/75">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-center text-sm text-[#2A4A35]/70">
            Security invariant: authorization happens before any evidence is scored, reranked or placed in model context.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 text-center text-sm text-[#2A4A35]/70">
        All documents, patients, identifiers, payers and devices in this system are synthetic and generated for the
        hackathon. This is an engineering demonstration, not a clinical decision tool.
      </section>
    </div>
  );
};

export default HomePage;
