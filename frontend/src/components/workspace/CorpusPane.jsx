import { useState } from 'react';
import { api } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';

const STATUS_STYLE = {
  active: 'bg-[#E8F2E9] text-[#2A4A35] border-[#A8C5AE]',
  superseded: 'bg-amber-50 text-amber-800 border-amber-300',
  retired: 'bg-gray-100 text-gray-600 border-gray-300',
  draft: 'bg-blue-50 text-blue-700 border-blue-200',
};

const CATEGORIES = ['clinical_guideline', 'sop', 'formulary', 'payer_policy', 'device_manual', 'audit_record'];

function IngestForm({ onDone }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    for (const [k, v] of [...fd.entries()]) if (!v || (v instanceof File && !v.name)) fd.delete(k);
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.ingest(fd);
      setMsg({ ok: true, text: `Ingested ${r.document_id} v${r.version}: ${r.chunks} chunks, ${r.pii_redactions} identifiers redacted.` });
      onDone();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full rounded-lg border border-[#C8DFC9] bg-white px-2 py-1 text-xs';
  return (
    <form onSubmit={submit} className="mt-2 space-y-1.5 rounded-xl border border-dashed border-[#A8C5AE] bg-[#F5F3EE] p-3">
      <input name="file" type="file" accept=".md,.csv,.json" required className="w-full text-xs" />
      <p className="text-[10px] text-[#6B8F71]">Markdown may carry front matter; otherwise fill metadata below.</p>
      <input name="document_id" placeholder="document_id (e.g. DOC-XYZ-2026)" className={input} />
      <input name="title" placeholder="title" className={input} />
      <div className="flex gap-1.5">
        <select name="category" defaultValue="" className={input}>
          <option value="">category…</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="version" placeholder="version" className={input} />
      </div>
      <div className="flex gap-1.5">
        <select name="status" defaultValue="" className={input}>
          <option value="">status…</option>
          {['active', 'superseded', 'retired', 'draft'].map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input name="supersedes" placeholder="supersedes (doc id)" className={input} />
      </div>
      <button disabled={busy} className="w-full rounded-lg bg-[#3D6B4F] py-1.5 text-xs font-semibold text-white disabled:opacity-50">
        {busy ? 'Parsing · redacting · embedding…' : 'Ingest through pipeline'}
      </button>
      {msg && <p className={`text-[11px] ${msg.ok ? 'text-[#2A4A35]' : 'text-red-700'}`}>{msg.text}</p>}
    </form>
  );
}

export default function CorpusPane() {
  const { corpus, role, refresh, backendError } = useWorkspace();
  const [showIngest, setShowIngest] = useState(false);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D6B4F]">Corpus & Ingest</h2>
        <button onClick={() => setShowIngest((s) => !s)} className="rounded-lg border border-[#A8C5AE] px-2 py-0.5 text-xs font-semibold text-[#2A4A35] hover:bg-[#E8F2E9]">
          {showIngest ? 'Close' : '+ Ingest Doc'}
        </button>
      </div>
      {showIngest && <IngestForm onDone={refresh} />}
      {backendError && <p className="mt-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">{backendError}</p>}
      <ul className="scroll-thin mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
        {(corpus?.documents || []).map((d, i) => (
          <li key={d.document_id} className={`rounded-xl border bg-white p-2.5 ${d.accessible ? 'border-green-100' : 'border-gray-200 opacity-60'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[#1E3A28]" title={d.title}>{i + 1}. {d.title}</div>
                <div className="truncate font-mono text-[10px] text-[#6B8F71]" title={d.source_file}>{d.source_file}</div>
              </div>
              <span title={d.accessible ? `Retrievable by ${role}` : `Not retrievable by ${role} (enforced server-side)`}
                className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${d.accessible ? 'bg-[#E8F2E9] text-[#2A4A35]' : 'bg-gray-200 text-gray-600'}`}>
                {d.accessible ? 'ACCESS' : 'LOCKED'}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px]">
              <span className="rounded border border-[#C8DFC9] px-1.5 py-0.5">v{d.version}</span>
              <span className={`rounded border px-1.5 py-0.5 font-semibold uppercase ${STATUS_STYLE[d.status] || ''}`}>{d.status}</span>
              <span className="rounded border border-[#C8DFC9] px-1.5 py-0.5">{d.category_label}</span>
              {d.classification === 'restricted' && <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 font-semibold text-red-700">RESTRICTED</span>}
              <span className="rounded border border-[#C8DFC9] px-1.5 py-0.5">{d.table_rows ? `${d.table_rows} rows` : `${d.chunks} chunks`}</span>
              {d.pii_redactions > 0 && <span className="rounded border border-[#C8DFC9] px-1.5 py-0.5">{d.pii_redactions} PII redacted</span>}
            </div>
            {d.superseded_by && <div className="mt-1 text-[10px] text-amber-800">Superseded by {d.superseded_by}</div>}
            {d.supersedes && <div className="mt-1 text-[10px] text-[#6B8F71]">Supersedes {d.supersedes}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
