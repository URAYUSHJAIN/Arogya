import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';
import PillLoader from '../components/PillLoader';

// Audit, Groundedness & Evaluation Dashboard. Every number shown here comes
// from POST /api/evaluate or GET /api/evaluation/latest; nothing is hard-coded.
const METRICS = [
  ['groundedness', 'Groundedness', 'Generator draft claims supported by their cited passages', true],
  ['citation_precision', 'Citation Precision', 'Citations that point to a gold evidence document', true],
  ['conflict_detection', 'Conflict Detection', 'Conflict questions where both disagreeing sources were surfaced', true],
  ['refusal_accuracy', 'Refusal Accuracy', 'Answer-vs-refuse decisions matching the expected outcome', true],
  ['pii_leakage', 'PII Leakage', 'Responses containing a registered identifier or PII pattern', false],
  ['unauthorized_evidence_rate', 'Unauthorized Evidence', 'Responses exposing evidence outside the role’s grants', false],
];

const pct = (v) => (v === null || v === undefined ? 'n/a' : `${(v * 100).toFixed(1)}%`);

function MetricTile({ label, help, value, higherIsBetter }) {
  const good = value === null || value === undefined ? null : higherIsBetter ? value >= 0.8 : value === 0;
  return (
    <div className={`rounded-2xl border p-4 ${good === null ? 'border-gray-200 bg-white' : good ? 'border-[#A8C5AE] bg-[#E8F2E9]' : 'border-amber-300 bg-amber-50'}`}>
      <div className="text-xs font-semibold uppercase tracking-wide text-[#3D6B4F]">{label}</div>
      <div className="mt-1 text-3xl font-bold text-[#1E3A28]">{pct(value)}</div>
      <div className="mt-1 text-[11px] text-[#2A4A35]/70">{help}</div>
    </div>
  );
}

const EmergencyPage = () => {
  const { refresh } = useWorkspace();
  const [report, setReport] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);
  const [audit, setAudit] = useState([]);

  const loadAudit = () => api.audit(20).then(setAudit).catch(() => {});
  useEffect(() => {
    api.latestEvaluation().then(setReport).catch(() => {});
    loadAudit();
  }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      setReport(await api.evaluate());
      refresh();
      loadAudit();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {running && <PillLoader text="Executing 15 benchmark queries through the live pipeline…" />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A28]">Audit, Groundedness & Evaluation Dashboard</h1>
          <p className="mt-1 text-sm text-[#2A4A35]/70">
            The benchmark (rag-pipeline/corpus/eval_questions.json) runs each question through the real pipeline with its role; metrics are computed from the responses.
          </p>
        </div>
        <button onClick={run} disabled={running} className="rounded-xl bg-[#2A4A35] px-5 py-3 font-semibold text-white shadow-sm hover:bg-[#1E3A28] disabled:opacity-50">
          Run Live Benchmark Suite (15 Queries)
        </button>
      </div>
      {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {!report && !running && (
        <div className="mt-8 rounded-2xl border border-dashed border-[#C8DFC9] p-10 text-center text-[#6B8F71]">No evaluation run recorded yet. Run the suite to produce measured results.</div>
      )}

      {report && (
        <>
          <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#2A4A35]">
            <span className="rounded-lg border border-[#C8DFC9] bg-white px-2 py-1">Run {report.run_id.slice(0, 8)}</span>
            <span className="rounded-lg border border-[#C8DFC9] bg-white px-2 py-1">{new Date(report.timestamp).toLocaleString()}</span>
            <span className="rounded-lg border border-[#C8DFC9] bg-white px-2 py-1">{report.completed_questions}/{report.total_questions} executed</span>
            <span className="rounded-lg border border-[#A8C5AE] bg-[#E8F2E9] px-2 py-1 font-semibold">{report.passed} passed</span>
            <span className={`rounded-lg border px-2 py-1 font-semibold ${report.failed ? 'border-amber-300 bg-amber-50' : 'border-[#C8DFC9] bg-white'}`}>{report.failed} failed</span>
            {report.duration_s && <span className="rounded-lg border border-[#C8DFC9] bg-white px-2 py-1">{report.duration_s}s</span>}
            {report.config?.generation && <span className="rounded-lg border border-[#C8DFC9] bg-white px-2 py-1">Generator: {report.config.generation.provider} · {report.config.generation.model}</span>}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {METRICS.map(([k, l, h, up]) => <MetricTile key={k} label={l} help={h} value={report.metrics[k]} higherIsBetter={up} />)}
          </div>
          {report.metrics.counts && (
            <p className="mt-2 text-[11px] text-[#6B8F71]">
              {report.metrics.counts.supported_generator_claims}/{report.metrics.counts.generator_claims} generator claims supported ·
              {' '}{report.metrics.counts.correct_citations}/{report.metrics.counts.citations} citations on gold documents ·
              {' '}conflict false-positive rate {pct(report.metrics.conflict_false_positive_rate)}
            </p>
          )}

          <div className="mt-6 grid gap-3 md:grid-cols-5">
            {Object.entries(report.categories || {}).map(([c, v]) => (
              <div key={c} className="rounded-xl border border-green-100 bg-white p-3">
                <div className="text-xs font-semibold uppercase text-[#6B8F71]">{c.replace('_', ' ')}</div>
                <div className="text-xl font-bold text-[#1E3A28]">{v.passed}/{v.total}</div>
                <div className="mt-1 h-1.5 rounded bg-[#E8F2E9]"><div className="h-1.5 rounded bg-[#3D6B4F]" style={{ width: `${(v.passed / v.total) * 100}%` }} /></div>
              </div>
            ))}
          </div>

          {report.per_question_results && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-green-100 bg-white">
              <table className="min-w-full text-xs">
                <thead className="bg-[#E8F2E9] text-left uppercase text-[#2A4A35]">
                  <tr><th className="p-2">ID</th><th className="p-2">Category</th><th className="p-2">Role</th><th className="p-2">Question</th><th className="p-2">Status</th><th className="p-2">Checks</th><th className="p-2">Result</th></tr>
                </thead>
                <tbody>
                  {report.per_question_results.map((r) => (
                    <tr key={r.question_id} className="border-t border-green-50 align-top">
                      <td className="p-2 font-mono">{r.question_id}</td>
                      <td className="p-2">{r.category}</td>
                      <td className="p-2 whitespace-nowrap">{r.role}</td>
                      <td className="p-2 max-w-sm">{r.question}{r.answer && <div className="mt-1 text-[11px] text-gray-500">{r.answer}</div>}</td>
                      <td className="p-2">{r.status}{r.refusal_reason ? <div className="text-[10px] text-gray-500">{r.refusal_reason}</div> : null}</td>
                      <td className="p-2">
                        {Object.entries(r.checks).map(([k, c]) => (
                          <div key={k} title={typeof c.detail === 'string' ? c.detail : JSON.stringify(c.detail)} className={c.passed ? 'text-[#3D6B4F]' : 'font-semibold text-red-700'}>
                            {c.passed ? '✓' : '✗'} {k}{!c.passed ? `: ${typeof c.detail === 'string' ? c.detail : JSON.stringify(c.detail)}` : ''}
                          </div>
                        ))}
                      </td>
                      <td className="p-2"><span className={`rounded px-2 py-0.5 font-bold ${r.passed ? 'bg-[#E8F2E9] text-[#2A4A35]' : 'bg-red-50 text-red-700'}`}>{r.passed ? 'PASS' : 'FAIL'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <h2 className="mt-10 text-xl font-bold text-[#1E3A28]">Recent audit events</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-green-100 bg-white">
        <table className="min-w-full text-xs">
          <thead className="bg-[#F5F3EE] text-left uppercase text-[#2A4A35]"><tr><th className="p-2">Time</th><th className="p-2">Event</th><th className="p-2">Role</th><th className="p-2">Query (redacted)</th><th className="p-2">Status</th><th className="p-2">Docs retrieved</th><th className="p-2">Conflict</th><th className="p-2">PII</th></tr></thead>
          <tbody>
            {audit.map((a) => (
              <tr key={a.id} className="border-t border-green-50">
                <td className="p-2 whitespace-nowrap">{new Date(a.created_at).toLocaleTimeString()}</td>
                <td className="p-2">{a.event_type}</td><td className="p-2">{a.role || '-'}</td>
                <td className="p-2 max-w-xs truncate">{a.query_redacted || '-'}</td><td className="p-2">{a.status || '-'}</td>
                <td className="p-2">{(a.retrieved_document_ids || []).join(', ') || '-'}</td>
                <td className="p-2">{a.conflict_detected ? 'yes' : a.conflict_detected === false ? 'no' : '-'}</td>
                <td className="p-2">{a.privacy ? (a.privacy.leak_detected_in_delivered_answer ? 'LEAK' : `clean (${a.privacy.output_identifiers_blocked} blocked)`) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmergencyPage;
