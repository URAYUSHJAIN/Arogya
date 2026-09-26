import { useEffect, useMemo, useRef, useState } from 'react';
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { api } from '../../services/api';
import { useWorkspace } from '../../context/WorkspaceContext';

function TableEvidenceViewer({ table, highlightRowId }) {
  const columns = useMemo(() => {
    const cols = table?.[0]?.columns || [];
    const h = createColumnHelper();
    return cols.map((c) => h.accessor((r) => r.cells[c], { id: c, header: c.replaceAll('_', ' ') }));
  }, [table]);
  const tbl = useReactTable({ data: table || [], columns, getCoreRowModel: getCoreRowModel() });
  const rowRef = useRef(null);
  useEffect(() => { rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [highlightRowId, table]);

  return (
    <div className="scroll-thin max-h-[420px] overflow-auto rounded-xl border border-[#C8DFC9]">
      <table className="min-w-full text-[11px]">
        <thead className="sticky top-0 bg-[#E8F2E9] text-left uppercase text-[#2A4A35]">
          {tbl.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>{hg.headers.map((hd) => <th key={hd.id} className="whitespace-nowrap px-2 py-1.5">{flexRender(hd.column.columnDef.header, hd.getContext())}</th>)}</tr>
          ))}
        </thead>
        <tbody>
          {tbl.getRowModel().rows.map((r) => {
            const hit = r.original.row_id === highlightRowId;
            return (
              <tr key={r.id} ref={hit ? rowRef : null} className={`border-t border-green-50 ${hit ? 'evidence-highlight font-semibold' : ''}`}>
                {r.getVisibleCells().map((c) => <td key={c.id} className="px-2 py-1 align-top">{flexRender(c.column.columnDef.cell, c.getContext())}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Meta({ k, v }) {
  if (v === null || v === undefined || v === '') return null;
  return <><dt className="text-[#6B8F71]">{k}</dt><dd className="font-medium text-[#1E3A28] break-all">{String(v)}</dd></>;
}

export default function TraceInspector({ selected }) {
  const { role } = useWorkspace();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const passageRef = useRef(null);

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    setLoading(true);
    setError(null);
    api.evidence(selected.chunk_id, role)
      .then((d) => { if (alive) setData(d); })
      .catch((e) => { if (alive) { setError(e.message); setData(null); } })
      .finally(() => alive && setLoading(false));
    api.auditEvent('citation_opened', role, { chunk_id: selected.chunk_id });
    return () => { alive = false; };
  }, [selected, role]);

  useEffect(() => { passageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [data]);

  if (!selected) {
    return (
      <div className="flex h-full flex-col">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D6B4F]">Trace Inspector</h2>
        <div className="mt-3 rounded-2xl border border-dashed border-[#C8DFC9] p-6 text-center text-sm text-[#6B8F71]">
          Click a citation <span className="rounded border border-[#A8C5AE] bg-[#E8F2E9] px-1 font-bold">1</span> to open the exact passage, table row or record.
        </div>
      </div>
    );
  }

  const ev = data?.evidence;
  const r = selected.retrieval || {};
  return (
    <div className="flex h-full flex-col">
      <h2 className="text-sm font-bold uppercase tracking-wider text-[#3D6B4F]">Trace Inspector {selected.ref ? `· [${selected.ref}]` : ''}</h2>
      {loading && <p className="mt-2 text-xs text-[#6B8F71]">Resolving evidence (re-authorized server-side)…</p>}
      {error && <p className="mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      {ev && (
        <div className="scroll-thin mt-2 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="rounded-2xl border border-green-100 bg-white p-3">
            <div className="text-sm font-semibold text-[#1E3A28]">{ev.title}</div>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
              <Meta k="Document" v={ev.document_id} />
              <Meta k="Version" v={ev.version} />
              <Meta k="Status" v={ev.lifecycle?.label} />
              <Meta k="Effective" v={ev.effective_from ? `${ev.effective_from} → ${ev.effective_to || 'present'}` : null} />
              <Meta k="Superseded by" v={ev.superseded_by} />
              <Meta k="Source" v={`${ev.source_file} (${ev.source_type})`} />
              <Meta k="Classification" v={ev.classification} />
              <Meta k="Section" v={ev.chunk_type === 'section_text' ? `${ev.section || ''} ${ev.section_title || ''}` : null} />
              <Meta k="Path" v={ev.heading_path} />
              <Meta k="Lines" v={ev.line_start ? `${ev.line_start}–${ev.line_end}` : null} />
              <Meta k="Table / Row" v={ev.row_id ? `${ev.table_id} / ${ev.row_id}` : null} />
              <Meta k="Record" v={ev.record_id} />
              <Meta k="Chunk" v={ev.chunk_id} />
              <Meta k="Retrieved via" v={r.sources?.join(' + ')} />
              <Meta k="BM25 score / rank" v={r.bm25_score != null ? `${r.bm25_score} / #${r.bm25_rank}` : null} />
              <Meta k="Dense cos / rank" v={r.dense_score != null ? `${r.dense_score} / #${r.dense_rank}` : null} />
              <Meta k="RRF score" v={r.rrf_score} />
              <Meta k="Rerank score" v={r.rerank_score} />
            </dl>
          </div>

          {data.table ? (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B8F71]">Table {ev.table_id} — row {ev.row_id} highlighted</div>
              <TableEvidenceViewer table={data.table} highlightRowId={ev.row_id} />
            </>
          ) : (
            <>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[#6B8F71]">Document context — cited passage highlighted</div>
              <div className="space-y-1.5">
                {data.document_chunks.map((c) => {
                  const hit = c.chunk_id === ev.chunk_id;
                  return (
                    <div key={c.chunk_id} ref={hit ? passageRef : null}
                      className={`rounded-lg border p-2 text-[12px] leading-relaxed ${hit ? 'evidence-highlight border-amber-500' : 'border-green-50 bg-white text-gray-500'}`}>
                      <div className="mb-0.5 text-[10px] font-semibold text-[#6B8F71]">
                        {c.record_id ? `Record ${c.record_id}` : c.heading_path}{c.line_start ? ` · L${c.line_start}–${c.line_end}` : ''}
                      </div>
                      <div className="whitespace-pre-wrap">{c.content}</div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
