import { Link, NavLink } from 'react-router-dom';
import { useWorkspace } from '../context/WorkspaceContext';
import { ROLES } from '../context/roles';

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-1.5 text-sm transition-colors ${isActive ? 'bg-[#E8F2E9] text-[#2A4A35] font-medium' : 'text-gray-600 hover:text-[#3D6B4F]'}`;

const Header = () => {
  const { role, setRole, corpus, privacy, backendError } = useWorkspace();
  const leaks = privacy?.leaks_in_delivered_answers;

  return (
    <header className="sticky top-0 z-40 border-b border-green-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-2.5">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3D6B4F]">
            <img src={`${import.meta.env.BASE_URL}logo.ico`} alt="" className="h-5 w-5 object-contain" />
          </div>
          <div className="leading-tight">
            <div className="font-['Playfair_Display'] text-lg font-bold text-[#1E3A28]">AROGYA</div>
            <div className="text-[10px] uppercase tracking-widest text-[#6B8F71]">Enterprise RAG</div>
          </div>
        </Link>

        <nav className="ml-2 flex items-center gap-1">
          <NavLink to="/" end className={navClass}>Overview</NavLink>
          <NavLink to="/ai-analysis" className={navClass}>Clinical Auditor</NavLink>
          <NavLink to="/emergency" className={navClass}>Evaluation</NavLink>
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-[#C8DFC9] bg-[#F5F3EE] px-3 py-1.5 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-[#6B8F71]">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="bg-transparent font-semibold text-[#1E3A28] outline-none"
              aria-label="Active role (validated by backend)"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>

          <span
            title={privacy ? `${privacy.queries_scanned} answers scanned · ${privacy.output_identifiers_blocked} identifiers blocked at output · ${privacy.ingestion_redactions} redacted at ingestion` : 'Privacy status unavailable'}
            className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
              leaks === undefined ? 'border-gray-200 bg-gray-50 text-gray-500'
                : leaks === 0 ? 'border-[#A8C5AE] bg-[#E8F2E9] text-[#2A4A35]' : 'border-red-300 bg-red-50 text-red-700'}`}
          >
            PII Guard: {leaks === undefined ? '—' : `${leaks} leak${leaks === 1 ? '' : 's'}`}
            {privacy ? <span className="ml-1 font-normal opacity-70">/ {privacy.queries_scanned} scanned</span> : null}
          </span>

          <span className="rounded-xl border border-[#C8DFC9] bg-white px-3 py-1.5 text-xs font-semibold text-[#2A4A35]">
            Docs: {corpus ? `${corpus.active} active / ${corpus.total}` : '—'}
          </span>
          {backendError && (
            <span className="rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700">Backend offline</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
