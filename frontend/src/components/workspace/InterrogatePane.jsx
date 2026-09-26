import { useState } from 'react';
import { api } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';

// Quick pills only pre-fill the input; the full live pipeline always runs.
const QUICK = [
  ['Formulary', 'What formulary tier and restriction apply to linezolid?'],
  ['Conflict', 'What is the recommended adult sepsis vancomycin regimen?'],
  ['Error code', 'What does ERR-404 mean on the X200 infusion pump?'],
  ['Refusal', 'What is the hospital policy on CAR-T cell therapy reimbursement?'],
  ['Audit (restricted)', 'Which adverse events involved the X200 infusion pump?'],
];

const STATUS = {
  answered: ['Grounded answer', 'bg-[#E8F2E9] text-[#2A4A35] border-[#A8C5AE]'],
  answered_with_conflict: ['Answer + conflict surfaced', 'bg-amber-50 text-amber-800 border-amber-300'],
  refused: ['Refused: insufficient evidence', 'bg-red-50 text-red-700 border-red-200'],
  generation_unavailable: ['Generator unavailable', 'bg-gray-100 text-gray-700 border-gray-300'],
};

function CiteChip({ n, onOpen, active }) {
  return (
    <button onClick={() => onOpen(n)} title="Open evidence in Trace Inspector"
      className={`mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md border px-1 align-text-top text-[11px] font-bold transition ${active ? 'border-amber-500 bg-amber-100 text-amber-900' : 'border-[#A8C5AE] bg-[#E8F2E9] text-[#2A4A35] hover:bg-[#C8DFC9]'}`}>
      {n}
    </button>
  );
}

function ConflictCard({ conflict, onOpen }) {
  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/70 p-4">
      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-900">
        <span>⚠ Conflict detected</span>
        <span className="rounded bg-amber-200 px-1.5 py-0.5 text-[10px] normal-case">{conflict.subject} · {conflict.kind}</span>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {conflict.sources.map((s, i) => (
          <div key={s.chunk_id} className="rounded-xl border border-amber-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-amber-800">Source {String.fromCharCode(65 + i)}</span>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${s.lifecycle.is_current ? 'bg-[#E8F2E9] text-[#2A4A35]' : 'bg-amber-200 text-amber-900'}`}>{s.lifecycle.label}</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-[#1E3A28]">{s.title}</div>
            <div className="text-[11px] text-[#6B8F71]">{s.document_id} · v{s.lifecycle.version}{s.section ? ` · §${s.section}` : ''}{s.row_id ? ` · ${s.row_id}` : ''}{s.lifecycle.effective_from ? ` · from ${s.lifecycle.effective_from}` : ''}</div>
            <div className="mt-2 font-mono text-sm font-bold text-amber-900">{s.values.join(' ; ')}</div>
            <p className="mt-1 line-clamp-3 text-xs text-gray-700">“{s.claim_text}”</p>
            <button onClick={() => onOpen(s.evidence_ref)} className="mt-2 text-xs font-semibold text-[#3D6B4F] underline">Open evidence [{s.evidence_ref}]</button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-amber-900">{conflict.assessment.summary}</p>
      {conflict.assessment.lifecycle_notes.map((n) => <p key={n} className="text-[11px] text-amber-800">• {n}</p>)}
    </div>
  );
}

function RefusalCard({ refusal, sufficiency }) {
  return (
    <div className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
      <div className="text-sm font-bold uppercase tracking-wide text-red-800">Refused · {refusal.reason.replaceAll('_', ' ')}</div>
      <p className="mt-2 text-sm text-red-900">{refusal.message}</p>
      <div className="mt-3 grid gap-2 text-xs text-red-900 md:grid-cols-2">
        <div><span className="font-semibold">Searched (authorized):</span> {refusal.searched_documents?.join(', ') || 'none'}</div>
        {sufficiency && <div><span className="font-semibold">Top rerank:</span> {sufficiency.top_rerank_score} · <span className="font-semibold">coverage:</span> {Math.round(sufficiency.coverage * 100)}%</div>}
        {refusal.missing_terms?.length > 0 && <div className="md:col-span-2"><span className="font-semibold">Missing evidence for:</span> {refusal.missing_terms.join(', ')}</div>}
        {refusal.escalation?.recommended && <div className="md:col-span-2"><span className="font-semibold">Escalate to:</span> {refusal.escalation.route}</div>}
      </div>
    </div>
  );
}

export default function InterrogatePane({ result, setResult, onOpenEvidence, activeRef }) {
  const { role, refresh } = useWorkspace();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = async (text) => {
    const q = (text ?? query).trim();
    if (q.length < 2) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    try {
      const r = await api.query(q, role);
      setResult(r);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const open = (n) => result && onOpenEvidence(result.evidence.find((e) => e.ref === n));
  const [label, cls] = STATUS[result?.status] || [];

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D6B4F]">Interrogate</h2>
      <form onSubmit={(e) => { e.preventDefault(); run(); }} className="mt-2 flex gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Ask as ${role}…`}
          className="flex-1 rounded-xl border border-[#A8C5AE] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3D6B4F] focus:ring-2 focus:ring-[#C8DFC9]" />
        <button disabled={loading} className="rounded-xl bg-[#2A4A35] px-5 text-sm font-semibold text-white hover:bg-[#1E3A28] disabled:opacity-50">
          {loading ? 'Running…' : 'Ask'}
        </button>
      </form>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {QUICK.map(([l, q]) => (
          <button key={l} onClick={() => setQuery(q)} className="rounded-full border border-[#C8DFC9] bg-white px-2.5 py-0.5 text-[11px] text-[#2A4A35] hover:bg-[#E8F2E9]">{l}</button>
        ))}
      </div>
      <div className="mt-1 text-[11px] text-[#6B8F71]">Role context <b>{role}</b> is sent to the backend, validated, and enforced inside retrieval.</div>

      <div className="scroll-thin mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading && (
          <div className="rounded-2xl border border-[#C8DFC9] bg-white p-4 text-sm text-[#3D6B4F]">
            <div className="flex items-center gap-3">
              <div className="h-5 w-12 animate-pulse rounded-full pill-gradient border border-[#6B8F71]" />
              Authorizing → BM25 + dense → RRF → cross-encoder → conflict & sufficiency → local synthesis → citation & PII verification…
            </div>
          </div>
        )}
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {!result && !loading && !error && (
          <div className="rounded-2xl border border-dashed border-[#C8DFC9] p-6 text-center text-sm text-[#6B8F71]">
            Ask any question. Answers come only from evidence your role is authorized to retrieve.
          </div>
        )}
        {result && !loading && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-lg border px-2 py-1 text-xs font-bold ${cls}`}>{label}</span>
              <span className="text-[11px] text-[#6B8F71]">
                {result.retrieval.authorized_chunks}/{result.retrieval.total_chunks} chunks authorized for {result.role} ·
                {' '}{result.retrieval.excluded_by_acl} excluded pre-retrieval · {result.retrieval.context_chunks} in context · {result.latency_ms} ms
              </span>
            </div>

            {result.lifecycle_warning && <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">{result.lifecycle_warning}</div>}

            {result.answer && (
              <div className="rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B8F71]">
                  Answer {result.conflicts.length ? '(from ACTIVE sources, see conflict below)' : ''}
                </div>
                <div className="mt-2 space-y-1.5 text-[15px] leading-relaxed text-[#1E3A28]">
                  {result.claims.map((c, i) => (
                    <p key={i}>
                      {c.text.replace(/\.$/, '')}{c.citations.map((n) => <CiteChip key={n} n={n} onOpen={open} active={activeRef === n} />)}.
                      <span className="ml-1 text-[10px] text-[#6B8F71]" title="Share of claim terms found in the cited passage">support {Math.round(c.support * 100)}%{c.auto_attributed ? ' · auto-attributed' : ''}</span>
                    </p>
                  ))}
                </div>
                {result.verification?.removed_claims?.length > 0 && (
                  <details className="mt-3 text-xs text-gray-600">
                    <summary className="cursor-pointer font-semibold text-red-700">{result.verification.removed_claims.length} generated sentence(s) removed: not supported by cited evidence</summary>
                    {result.verification.removed_claims.map((r, i) => <p key={i} className="mt-1 line-through">{r.text} <span className="no-underline">({r.reason})</span></p>)}
                  </details>
                )}
                <div className="mt-3 border-t border-green-50 pt-2 text-[11px] text-[#6B8F71]">
                  Generator: {result.generation?.provider} · {result.generation?.model}{result.generation?.mode === 'extractive_fallback' ? ` · EXTRACTIVE FALLBACK (${result.generation.fallback_reason})` : ''}
                  {' '}· PII: {result.privacy.leak_detected_in_delivered_answer ? 'LEAK' : 'clean'} ({result.privacy.output_identifiers_blocked} blocked at output)
                </div>
              </div>
            )}

            {result.conflicts.map((c, i) => <ConflictCard key={i} conflict={c} onOpen={open} />)}
            {result.refusal && <RefusalCard refusal={result.refusal} sufficiency={result.sufficiency} />}

            {result.citations.length > 0 && (
              <div className="rounded-2xl border border-green-100 bg-white p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B8F71]">Citations</div>
                <ul className="mt-1 space-y-1">
                  {result.citations.map((c) => (
                    <li key={c.ref}>
                      <button onClick={() => open(c.ref)} className="w-full rounded-lg px-2 py-1 text-left text-xs hover:bg-[#E8F2E9]">
                        <b>[{c.ref}]</b> {c.document_id} · v{c.version} · {c.status}
                        {c.section && c.chunk_type === 'section_text' ? ` · §${c.section} ${c.section_title}` : ''}
                        {c.row_id ? ` · ${c.table_id} ${c.row_id}` : ''}{c.record_id ? ` · record ${c.record_id}` : ''}
                        <span className="font-mono text-[#6B8F71]"> · {c.chunk_id.split('#')[1]}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <details className="rounded-2xl border border-green-100 bg-white p-3 text-xs">
              <summary className="cursor-pointer font-bold uppercase tracking-wide text-[#6B8F71]">Retrieved evidence ({result.evidence.length}) & retrieval trace</summary>
              <table className="mt-2 w-full text-left">
                <thead className="text-[10px] uppercase text-[#6B8F71]"><tr><th>#</th><th>Chunk</th><th>Via</th><th>BM25</th><th>Dense</th><th>RRF</th><th>Rerank</th></tr></thead>
                <tbody>
                  {result.evidence.map((e) => (
                    <tr key={e.chunk_id} className="cursor-pointer border-t border-green-50 hover:bg-[#E8F2E9]" onClick={() => onOpenEvidence(e)}>
                      <td>{e.ref}</td><td className="font-mono">{e.chunk_id}</td><td>{e.retrieval.sources.join('+')}</td>
                      <td>{e.retrieval.bm25_rank ?? '-'}</td><td>{e.retrieval.dense_rank ?? '-'}</td>
                      <td>{e.retrieval.rrf_score}</td><td className="font-semibold">{e.retrieval.rerank_score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-[10px] text-[#6B8F71]">Trace ID {result.trace_id}. Sufficiency: {result.sufficiency.reason} (top {result.sufficiency.top_rerank_score}, coverage {Math.round(result.sufficiency.coverage * 100)}%).</p>
            </details>
          </>
        )}
      </div>
    </div>
  );
}
