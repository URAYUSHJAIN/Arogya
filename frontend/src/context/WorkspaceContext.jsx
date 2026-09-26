import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';


const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const [role, setRole] = useState(() => {
    try { return localStorage.getItem('arogya.role') || 'Physician'; } catch { return 'Physician'; }
  });
  const [corpus, setCorpus] = useState(null);
  const [privacy, setPrivacy] = useState(null);
  const [backendError, setBackendError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const [docs, priv] = await Promise.all([api.documents(role), api.privacyStatus()]);
      setCorpus(docs);
      setPrivacy(priv);
      setBackendError(null);
    } catch (e) {
      setBackendError(e.message);
    }
  }, [role]);

  useEffect(() => {
    try { localStorage.setItem('arogya.role', role); } catch { /* storage unavailable */ }
    refresh();
  }, [role, refresh]);

  return (
    <WorkspaceContext.Provider value={{ role, setRole, corpus, privacy, refresh, backendError }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useWorkspace = () => useContext(WorkspaceContext);
