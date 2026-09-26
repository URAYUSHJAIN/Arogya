import { useState } from 'react';
import CorpusPane from '../components/workspace/CorpusPane';
import InterrogatePane from '../components/workspace/InterrogatePane';
import TraceInspector from '../components/workspace/TraceInspector';

// Enterprise 3-pane Clinical Auditor Workspace.
const AIAnalysisPage = () => {
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);

  const onResult = (r) => {
    setResult(r);
    const first = r?.citations?.[0];
    setSelected(first ? r.evidence.find((e) => e.ref === first.ref) : null);
  };

  return (
    <div className="mx-auto grid h-[calc(100vh-7.5rem)] max-w-[1600px] gap-3 p-3 lg:grid-cols-[minmax(230px,20%)_minmax(0,1fr)_minmax(300px,30%)]">
      <section className="min-h-0 overflow-hidden rounded-2xl border border-green-100 bg-[#F5F3EE] p-3"><CorpusPane /></section>
      <section className="min-h-0 overflow-hidden rounded-2xl border border-green-100 bg-[#FDFCF9] p-3 shadow-sm">
        <InterrogatePane result={result} setResult={onResult} onOpenEvidence={(e) => e && setSelected(e)} activeRef={selected?.ref} />
      </section>
      <section className="min-h-0 overflow-hidden rounded-2xl border border-green-100 bg-[#F5F3EE] p-3"><TraceInspector selected={selected} /></section>
    </div>
  );
};

export default AIAnalysisPage;
