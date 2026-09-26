// Thin client for the Arogya FastAPI backend.
// Security note: the role sent here is only a *claim*; the backend validates it
// and applies RBAC inside retrieval. Nothing in this file decides access.
const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new Error('Backend unavailable: start the FastAPI server (python server.py).');
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { detail: text }; }
  if (!res.ok) {
    const detail = data?.detail;
    throw Object.assign(new Error(typeof detail === 'string' ? detail : `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}

const q = (role) => (role ? `?role=${encodeURIComponent(role)}` : '');

export const api = {
  health: () => request('/api/health'),
  roles: () => request('/api/roles'),
  documents: (role) => request(`/api/documents${q(role)}`),
  document: (id, role) => request(`/api/documents/${encodeURIComponent(id)}${q(role)}`),
  evidence: (chunkId, role) => request(`/api/evidence/${encodeURIComponent(chunkId)}${q(role)}`),
  query: (query, role) => request('/api/query', { method: 'POST', body: JSON.stringify({ query, role }) }),
  ingest: (formData) => request('/api/ingest', { method: 'POST', body: formData }),
  evaluate: () => request('/api/evaluate', { method: 'POST' }),
  latestEvaluation: () => request('/api/evaluation/latest'),
  privacyStatus: () => request('/api/privacy/status'),
  audit: (limit = 25) => request(`/api/audit?limit=${limit}`),
  auditEvent: (event_type, role, details) =>
    request('/api/audit/events', { method: 'POST', body: JSON.stringify({ event_type, role, details }) }).catch(() => null),
};
