# Existing Codebase vs New Work

## Reused (written before the event, ArogyaPlus)

* React 19 + Vite + Tailwind v4 build setup (`frontend/package.json`, `vite.config.js` — rewritten)
* `frontend/src/index.css` palette, fonts and PillLoader animation (leaflet/emergency styles removed)
* `frontend/src/components/PillLoader.jsx` (unchanged)
* Brand assets in `frontend/public/`
* Router skeleton in `frontend/src/main.jsx` (three routes kept)

## Removed

Doctors, Blog, MapView, Hero, Services, Specialties, Testimonials, MobileApp, PatientCare,
AIFeatures, About, HowItWorks components; `geminiService.js`, `aiService.js`,
`emergencyService.js`, `locationService.js`; `data/hospitals.js`, `data/translations.js`;
dependencies `@google/generative-ai`, leaflet, react-leaflet, pdfjs-dist, jspdf, html2canvas,
react-hook-form, framer-motion, vite-plugin-pwa; the Hugging Face router proxy.

## New (built during the event for P-02)

* Entire `rag-pipeline/` backend: config, PostgreSQL schema/migrations, RBAC, privacy gate,
  Markdown/CSV/JSON ingestion and chunking, hybrid retriever, cross-encoder reranking,
  conflict & lifecycle engine, sufficiency/refusal gate, local generation providers,
  claim verification, audit logging, evaluator, FastAPI server, pytest suite.
* Synthetic corpus (6 documents) and 15-question benchmark.
* Frontend: `WorkspaceContext`, `services/api.js`, new `Header`, `Footer`, `HomePage`,
  3-pane workspace (`CorpusPane`, `InterrogatePane`, `TraceInspector` with TanStack Table),
  evaluation dashboard.
* `docs/` and `README.md`.
