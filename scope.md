# Scope — DayNote

## Vision and Goals

DayNote is a privacy-first, web-based note-taking application designed for people who write in more than one language and want their notes organised by the day they were written. The long-term vision is a lightweight personal knowledge base that works offline, stays under the user's control, and—optionally—lets an AI assistant answer questions grounded in the user's own notes without sending that data to third-party servers unless the user explicitly opts in.

**Core goals:**

- Provide a fast, distraction-free writing experience that handles any Unicode script or input method without friction.
- Organise notes by calendar date automatically, with no manual filing required.
- Keep all user data local by default; the user decides if and when data leaves the device.
- Offer an optional AI bot that queries notes intelligently while respecting data-ownership principles.
- Ship a fully accessible, keyboard-navigable interface that works on desktop and mobile browsers.

---

## Primary Features (Must-Have)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Daily note canvas** | One or more notes per calendar day; automatically grouped by date on a timeline view. |
| 2 | **Multilingual typing** | Full Unicode support; users can switch the `lang` attribute per note; browser IME passes through unmodified. |
| 3 | **Per-note language tag** | Each note stores a BCP-47 language code (e.g. `te`, `hi`, `ja`, `en`). Displayed as a badge; used for spell-check and font hinting. |
| 4 | **Rich-text / Markdown editing** | Markdown-first editor (e.g. CodeMirror or TipTap) with a live preview toggle. |
| 5 | **Tag system** | Free-form tags per note; tag-cloud / filter sidebar. |
| 6 | **Local-first storage** | All note data saved to `localStorage` (MVP); zero network dependency for core functionality. |
| 7 | **Search** | Full-text search across all notes, including across languages, with highlighted matches. |
| 8 | **Export** | Export all notes (or a date range) as JSON or Markdown zip. |
| 9 | **Responsive layout** | Works on phones, tablets, and desktops; no native app required. |
| 10 | **Accessibility baseline** | WCAG 2.1 AA compliance; full keyboard navigation; screen-reader-friendly markup. |

---

## Optional Enhancements

- **AI bot** — Ask questions answered from your own notes (RAG-lite, client-side or configurable endpoint).
- **Real-time collaboration** — Shared notebooks via WebSockets or CRDTs (e.g. Yjs).
- **Cloud sync** — Pluggable adapter for Supabase, PocketBase, or a custom REST backend.
- **Offline-first via IndexedDB + Service Worker** — Full PWA; works without a connection.
- **Version history** — Per-note revision log with diff viewer.
- **Reminders / due dates** — Attach a reminder to any note; browser notification support.
- **Notebook / folder organisation** — Group notes beyond dates; hierarchical notebooks.
- **Multilingual UI** — App chrome available in multiple languages via `next-intl`.
- **Data analytics** — Word-count trends, note frequency heat-map, language distribution.
- **AI-assisted summaries** — Summarise a day's or week's notes on demand.
- **Privacy controls dashboard** — Granular consent screen for any AI or sync feature.

---

## Non-Functional Requirements

### Performance
- First Contentful Paint < 1.5 s on a median mobile device (Lighthouse ≥ 90).
- Note save round-trip (to localStorage) < 50 ms.
- Search results appear < 200 ms for a corpus up to 10,000 notes.
- AI bot first-token latency < 3 s on a standard broadband connection (streaming preferred).

### Accessibility
- WCAG 2.1 Level AA minimum.
- All interactive elements reachable and operable by keyboard alone.
- ARIA roles and live regions used correctly; tested with NVDA/VoiceOver.
- Sufficient colour contrast in both light and dark themes (≥ 4.5:1 normal text).
- `lang` attribute on `<html>` and per-note containers reflects the correct BCP-47 code.

### Security
- No user data transmitted without explicit user action.
- Content Security Policy (CSP) headers prevent XSS.
- If a backend is enabled: all traffic over HTTPS/TLS 1.3; JWT-based auth; data encrypted at rest.
- AI API keys stored in environment variables (server-side) or entered locally by the user; never hard-coded or exposed in client bundles.

### Data Ownership
- The user can export the full dataset at any time.
- Deleting an account (if auth is enabled) triggers a full server-side data purge.
- AI features display a clear consent notice before any note content is sent externally.
- No analytics or telemetry without opt-in.

---

## Constraints and Assumptions

- **Web-only** — No React Native or Electron target in v1; the PWA path covers offline mobile use.
- **Client-side storage (MVP)** — `localStorage` cap (~5–10 MB per origin) is acceptable for MVP; heavy users will be guided toward the IndexedDB adapter.
- **No multi-device sync in MVP** — The export/import flow is the migration path until a sync backend is wired up.
- **AI bot is entirely optional** — The app must be fully functional without it; all AI UI is rendered conditionally behind a feature flag.
- **Single-user per browser origin** — Multi-account support deferred; users with multiple accounts use separate browser profiles.
- **Configurable AI provider** — No single vendor lock-in; the endpoint, model name, and API key are all user-configurable.
- **No real-time collaboration in v1** — Yjs integration scoped to a future milestone.

---

## Milestones and Success Criteria

| Milestone | Deliverables | Success Criteria |
|-----------|-------------|-----------------|
| **M0 — Foundation** (Week 1–2) | Next.js scaffold, Tailwind + shadcn/ui, i18n wiring, CI pipeline | `npm run dev` boots; Lighthouse accessibility score ≥ 85 |
| **M1 — Core Notes** (Week 3–5) | Daily canvas, Markdown editor, localStorage adapter, tag system | User can create, edit, delete, and tag notes; data persists across page reloads |
| **M2 — Search & Export** (Week 6–7) | Full-text search, JSON/Markdown export, date-range filter | Search returns results in < 200 ms; export produces valid, importable files |
| **M3 — Multilingual Polish** (Week 8–9) | Per-note language tag, font hinting, RTL layout support, multilingual UI strings | At least 4 UI languages; RTL scripts render correctly |
| **M4 — AI Bot (optional)** (Week 10–12) | Configurable AI endpoint, note-context prompt builder, consent UI | Bot answers questions citing specific notes; no data sent without consent dialogue |
| **M5 — PWA & Performance** (Week 13–14) | Service Worker, IndexedDB adapter, offline banner, Lighthouse audit | Lighthouse PWA score ≥ 90; app loads and edits notes while fully offline |
| **M6 — Beta Release** (Week 15–16) | Public repo, documentation, issue tracker open | 5 external testers complete onboarding without assistance |
