# Specifications — DayNote

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Browser / Client                   │
│                                                     │
│  Next.js (App Router)  ─►  React + TypeScript       │
│  Tailwind CSS + shadcn/ui                           │
│  next-intl  (i18n)                                  │
│  CodeMirror / TipTap  (editor)                      │
│  Fuse.js  (search)                                  │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │           Storage Adapter (interface)         │   │
│  │  LocalStorageAdapter  │  IndexedDBAdapter     │   │
│  │  (MVP)                │  (PWA / offline)      │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  AI Bot Module (optional, feature-flagged)          │
│  └─► fetch → user-configured OpenAI-compat. API    │
└─────────────────────────────────────────────────────┘
         │  (optional, future)
         ▼
┌─────────────────────────┐
│  Backend (Next.js Route  │
│  Handlers / REST API)   │
│  PostgreSQL / Supabase  │
│  Auth: NextAuth.js      │
└─────────────────────────┘
```

### Frontend Framework

**Next.js 14 (App Router) + React 18 + TypeScript 5**

- App Router enables per-route streaming, Server Components for the shell, and a clean path to adding API Route Handlers when a backend is wired in.
- Client Components are used exclusively for interactive note editor, search, and AI bot widgets.
- All client-only state lives in Zustand stores; server state (when backend exists) is managed with TanStack Query.

### Storage Approach

A thin `StorageAdapter` interface decouples business logic from the persistence layer:

```typescript
interface StorageAdapter {
  getNotesByDate(date: string): Promise<Note[]>;
  getAllNotes(): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;
  exportAll(): Promise<ExportBundle>;
}
```

- **MVP:** `LocalStorageAdapter` — serialises to JSON, keyed by `daynote:notes`.
- **PWA tier:** `IndexedDBAdapter` — object store per entity type; handles > 50 MB corpora.
- **Cloud tier (future):** `RemoteAdapter` wraps REST endpoints with optimistic updates and conflict resolution.

---

## Data Model

### `Note`

```typescript
interface Note {
  id: string;              // UUID v4
  date: string;            // ISO 8601 date, e.g. "2025-03-25"
  createdAt: string;       // ISO 8601 datetime
  updatedAt: string;       // ISO 8601 datetime
  language: string;        // BCP-47 code, e.g. "te", "hi", "en", "ja"
  content: string;         // Raw Markdown
  contentHtml?: string;    // Cached rendered HTML (optional, derived)
  tags: string[];          // Free-form tag strings
  title?: string;          // Inferred from first heading / first 60 chars
  pinned: boolean;
  archived: boolean;
  wordCount: number;       // Computed on save
  aiContext?: AIContext;   // Populated only if AI feature enabled
}
```

### `AIContext`

```typescript
interface AIContext {
  summarySnippet?: string; // Short auto-summary (user-triggered)
  embeddingVector?: number[]; // Optional; for client-side vector search
  lastQueriedAt?: string;
}
```

### `Tag`

Tags are denormalised strings stored on `Note.tags`. A derived tag index is maintained in a separate store for fast faceted filtering:

```typescript
interface TagIndex {
  [tag: string]: string[]; // tag → array of Note IDs
}
```

### `UserPreferences`

```typescript
interface UserPreferences {
  defaultLanguage: string;
  theme: 'light' | 'dark' | 'system';
  editorMode: 'markdown' | 'richtext';
  uiLocale: string;        // BCP-47 UI language
  aiEnabled: boolean;
  aiEndpoint?: string;
  aiModel?: string;
  aiApiKey?: string;       // Stored in localStorage; never sent to DayNote servers
  storageAdapter: 'localstorage' | 'indexeddb' | 'remote';
  remoteBaseUrl?: string;
}
```

---

## Features, Data Flows, and UI States

### 1. Daily Note Canvas

**Flow:**
1. User lands on `/` → redirected to `/notes/[today's ISO date]`.
2. `DayView` Server Component renders the page shell with the date header.
3. Client Component `NoteList` fetches notes for that date via `storageAdapter.getNotesByDate(date)`.
4. If no notes exist, an empty-state prompt is shown with a "New Note" CTA.

**UI States:** `loading` → `empty` → `populated` → `editing` → `saving` (optimistic, ≤ 50 ms) → `saved`.

**API endpoint (future backend):**
```
GET  /api/notes?date=2025-03-25
POST /api/notes
PUT  /api/notes/:id
DEL  /api/notes/:id
```

### 2. Note Editor

- Editor component: **TipTap** (rich-text mode) or **CodeMirror 6** (Markdown mode); switchable per-user preference.
- Language selector dropdown sets `note.language` and the wrapping `<div lang="...">` attribute; updates CSS `font-family` hinting for CJK / Indic scripts.
- Auto-save debounced at 800 ms after last keystroke.
- Word count computed on each save cycle.
- Toolbar: bold, italic, code, heading, link, image (base64 embed), language picker, tag input.

**UI States:** `idle` → `dirty` (unsaved indicator) → `saving` → `saved` / `error`.

### 3. Multilingual Typing

- The `<textarea>` / editor container sets `lang`, `spellcheck`, and `dir` (LTR/RTL) dynamically from `note.language`.
- RTL detection: `['ar','he','fa','ur','yi'].includes(primaryLang)` → `dir="rtl"`.
- No custom IME handling required; the browser IME pipeline is not intercepted.
- Font stack per script family defined as CSS custom properties:

```css
[lang^="te"], [lang^="kn"], [lang^="ml"] { --editor-font: 'Noto Sans Telugu', serif; }
[lang^="hi"], [lang^="mr"]               { --editor-font: 'Noto Sans Devanagari', serif; }
[lang^="ja"], [lang^="zh"]               { --editor-font: 'Noto Sans CJK JP', sans-serif; }
[lang^="ar"], [lang^="fa"]               { --editor-font: 'Noto Naskh Arabic', serif; }
```

### 4. Tag System

- Tags entered in a combobox (free-form + autocomplete from existing tags).
- Tag cloud in the sidebar; clicking a tag filters the timeline to matching notes.
- Tag data stored denormalised on each note plus an in-memory `TagIndex` rebuilt on load.

### 5. Search

- **Library:** Fuse.js with `keys: ['title', 'content', 'tags']`, threshold 0.3.
- Search index built once on load; incrementally updated on each save.
- UI: Command palette (`⌘K` / `Ctrl+K`) with real-time results; match highlighting via `<mark>` elements.
- Results grouped by date; click navigates to the DayView for that date with the note scrolled into view.

**UI States:** `idle` → `searching` → `results (N)` → `no results` → `error`.

### 6. Export / Import

- **Export:** `StorageAdapter.exportAll()` returns `{ notes: Note[], preferences: UserPreferences, exportedAt: string }`. Client triggers a file download as `.json` or a `.zip` of per-note `.md` files.
- **Import:** File picker → parse JSON → validate schema with Zod → merge or overwrite prompt → re-index.
- Date-range filter available in the export dialog.

---

## Accessibility and Responsive Design

- **Semantic HTML:** `<main>`, `<nav>`, `<aside>`, `<article>` used throughout; headings in logical order.
- **Focus management:** When a modal opens, focus moves to it and is trapped; when it closes, focus returns to the trigger.
- **ARIA:** `role="status"` on auto-save indicator; `aria-live="polite"` on search result count; `aria-label` on icon-only buttons.
- **Colour contrast:** Design tokens enforce AA contrast ratios; verified via Storybook a11y addon.
- **Keyboard shortcuts:**

| Action | Shortcut |
|--------|----------|
| New note | `N` (global, when not in editor) |
| Save note | `Ctrl/⌘ + S` |
| Open search | `Ctrl/⌘ + K` |
| Toggle preview | `Ctrl/⌘ + P` |
| Navigate days | `←` / `→` in timeline |

- **Responsive breakpoints:** `sm` 640 px (single column), `md` 768 px (sidebar collapses to drawer), `lg` 1024 px (full two-column layout).
- **Touch targets:** Minimum 44 × 44 px for all interactive elements.
- **Reduced motion:** `prefers-reduced-motion` media query disables transitions.

---

## AI Bot Integration Plan

### Capabilities

- **Q&A over notes:** User asks a natural-language question; the bot retrieves the most relevant note excerpts and answers with citations.
- **Day summary:** Summarise all notes for a given date in 3–5 sentences.
- **Tag suggestions:** Suggest tags for a note based on its content.
- **Translation assistance:** Translate a selected passage to a target language.

### Architecture

```
User question
     │
     ▼
ContextBuilder
  • Fuse.js search on question terms → top 10 matching note excerpts
  • Truncate to ~3,000 tokens
  • Build system prompt (see below)
     │
     ▼
fetch → AI Endpoint (user-configured, OpenAI-compatible)
     │
     ▼
StreamingResponseParser → renders token-by-token in chat bubble
```

### Prompt Strategy

```
System:
  You are a personal assistant with access to the user's notes.
  Answer questions strictly based on the provided note excerpts.
  If the answer is not in the notes, say so.
  Cite note dates and first lines when referencing specific notes.
  Do not fabricate information.

Context:
  [Relevant note excerpts, formatted as:
   --- Note: 2025-03-20 | Tags: work, python ---
   <excerpt>
   ---]

User: <question>
```

### Privacy Considerations

- The AI feature renders behind an `AIEnabled` feature flag; disabled by default.
- On first activation, a consent modal explains: what data is sent (note excerpts, not full corpus), to which endpoint, and that the user's API key is used directly.
- API key is stored only in `localStorage` / `UserPreferences`; never sent to DayNote's own servers.
- No telemetry on AI queries.
- Users can configure a self-hosted or local model endpoint (e.g. Ollama) to keep all data on-device.

### Latency Targets

| Operation | Target |
|-----------|--------|
| Context build (Fuse.js search + truncation) | < 100 ms |
| First token from AI endpoint | < 3 s |
| Full response (streaming) | < 15 s |

---

## Security and Privacy Notes

| Concern | Mitigation |
|---------|-----------|
| XSS | DOMPurify sanitises all rendered HTML; strict CSP header; TipTap output sanitised |
| Data at rest | localStorage data is origin-scoped; no additional encryption in MVP; IndexedDB adapter supports optional AES-GCM encryption of note content |
| Data in transit | HTTPS/TLS 1.3 enforced; HSTS preload when backend is deployed |
| Authentication (future backend) | NextAuth.js; OAuth 2.0 providers + magic-link email; session stored in HttpOnly, Secure cookies |
| API key exposure | Keys stored in client localStorage only; route handlers proxy AI calls server-side when backend is present, so the key is never in client bundles |
| CORS | API Route Handlers set `Access-Control-Allow-Origin` to own origin only |
| Dependency supply chain | Dependabot enabled; `npm audit` in CI pipeline; pinned lockfile |
| User consent | Consent flags in `UserPreferences`; AI and sync features gated behind explicit opt-in |

---

## Testing Strategy

### Unit Tests — Vitest + React Testing Library

- `StorageAdapter` implementations: CRUD, export, import, edge cases (empty store, quota exceeded).
- `ContextBuilder`: given a set of mock notes and a query, verify excerpt selection and token truncation.
- Utility functions: date formatting, BCP-47 detection, RTL heuristic, word-count.
- Zod schema validators for `Note` and `UserPreferences`.

### Integration Tests — Vitest + JSDOM

- Note creation → storage → retrieval → search index update cycle.
- Export → parse → import round-trip (data integrity).
- Tag index consistency after bulk operations.

### End-to-End Tests — Playwright

| Scenario | Assertions |
|----------|-----------|
| Create a note in Telugu, switch to English, create another | Both notes visible; language badges correct |
| Search for a term present in one note | Correct note highlighted in results |
| Export notes, clear storage, import | All notes restored with correct metadata |
| Open AI bot, ask a question about a note | Response contains the note's date/content |
| Navigate by keyboard only through entire app | No focus traps; all actions reachable |

### Accessibility Tests

- Axe-core integrated into Playwright runs; zero `critical` or `serious` violations on all main routes.
- Storybook a11y addon runs on all UI component stories in CI.

### Performance Tests

- Lighthouse CI runs on each PR; budgets: Performance ≥ 90, Accessibility ≥ 95.
- Custom Playwright script measures search latency with a synthetic 5,000-note corpus.
