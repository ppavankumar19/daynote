# DayNote

> A privacy-first, multilingual note-taking app organised by day — with an optional AI assistant that answers questions from your own notes.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI](https://github.com/your-org/daynote/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/daynote/actions)
[![Lighthouse Accessibility](https://img.shields.io/badge/a11y-WCAG%202.1%20AA-green)](https://web.dev/accessibility)

---

## Table of Contents

1. [About](#about)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Setup and Run](#setup-and-run)
5. [Features](#features)
6. [Roadmap](#roadmap)
7. [Using the AI Bot](#using-the-ai-bot)
8. [Contributing](#contributing)
9. [License and Contact](#license-and-contact)

---

## About

DayNote lets you write in any language, on any device, without signing up for an account. Notes are automatically grouped by the day you write them. Your data lives in your browser by default — no cloud, no tracking, no ads.

When you're ready for more, you can:

- Enable the optional AI bot to ask questions answered from your own notes.
- Export everything as JSON or Markdown and import it elsewhere.
- Connect a self-hosted backend for multi-device sync (coming in a future release).

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| **Framework** | Next.js 14 (App Router) | SSR flexibility, API Route Handlers, clean PWA path |
| **Language** | TypeScript 5 | End-to-end type safety across data model and UI |
| **UI** | React 18 + Tailwind CSS + shadcn/ui | Rapid, accessible component composition |
| **Editor** | TipTap (rich-text) / CodeMirror 6 (Markdown) | Mature, extensible, IME-safe |
| **State** | Zustand | Minimal boilerplate; easy to test |
| **Storage (MVP)** | `localStorage` via adapter pattern | Zero-dependency local persistence |
| **Storage (PWA)** | IndexedDB (Dexie.js) | Handles large corpora; offline-capable |
| **Search** | Fuse.js | Client-side fuzzy full-text; no server needed |
| **i18n** | next-intl | Type-safe translations; pluralisation; RTL |
| **AI bot (optional)** | User-configured OpenAI-compatible endpoint | No vendor lock-in; works with Ollama, Azure, etc. |
| **Testing** | Vitest + React Testing Library + Playwright | Unit, integration, and e2e coverage |
| **CI** | GitHub Actions + Lighthouse CI | Automated quality gates on every PR |

---

## Project Structure

```
daynote/
├── app/                        # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                # Redirects to today's date
│   ├── notes/
│   │   └── [date]/
│   │       └── page.tsx        # DayView
│   └── api/                    # Route Handlers (future backend)
│       └── notes/
│           └── route.ts
├── components/
│   ├── editor/                 # TipTap / CodeMirror wrappers
│   ├── note/                   # NoteCard, NoteList, NoteToolbar
│   ├── search/                 # CommandPalette, SearchResult
│   ├── ai/                     # ChatBubble, ConsentModal, BotPanel
│   ├── settings/               # PreferencesDrawer, StorageInfo
│   └── ui/                     # shadcn/ui re-exports + custom primitives
├── lib/
│   ├── storage/
│   │   ├── adapter.ts          # StorageAdapter interface
│   │   ├── localstorage.ts
│   │   └── indexeddb.ts
│   ├── ai/
│   │   ├── context-builder.ts  # Fuse search → prompt construction
│   │   └── client.ts           # Streaming fetch wrapper
│   ├── i18n/
│   │   └── messages/           # en.json, te.json, hi.json, ja.json …
│   └── utils/                  # date helpers, RTL detection, word-count
├── stores/                     # Zustand stores
│   ├── notes.store.ts
│   ├── preferences.store.ts
│   └── search.store.ts
├── types/
│   └── index.ts                # Note, UserPreferences, AIContext, …
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/                    # Playwright specs
├── public/
│   ├── manifest.json           # PWA manifest
│   └── sw.js                   # Service Worker (generated)
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── vitest.config.ts
```

---

## Setup and Run

### Prerequisites

- Node.js ≥ 20 LTS
- npm ≥ 10 (or pnpm / yarn — adjust commands accordingly)

### Development

```bash
# 1. Clone the repo
git clone https://github.com/your-org/daynote.git
cd daynote

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env.local
# Edit .env.local — all values are optional for local-only mode

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

### Environment Variables

```dotenv
# .env.example

# ── Optional backend ──────────────────────────────────────────
NEXT_PUBLIC_BACKEND_URL=          # e.g. https://api.yourdomain.com

# ── Auth (NextAuth.js) ────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=                  # `openssl rand -base64 32`

# ── AI proxy (server-side, keeps key out of browser bundle) ──
AI_PROXY_ENDPOINT=                # Forwarded to OpenAI-compat API
AI_PROXY_API_KEY=                 # Used only in Route Handler

# ── Feature flags ─────────────────────────────────────────────
NEXT_PUBLIC_AI_ENABLED=false      # "true" to show AI UI by default
NEXT_PUBLIC_STORAGE_ADAPTER=localstorage  # "indexeddb" | "remote"
```

> **Local-only mode:** Leave all variables blank. The app works entirely in the browser with zero external dependencies.

### Production Build

```bash
npm run build       # Type-check, lint, then Next.js production build
npm run start       # Start the production server

# Or export as static site (no server-side features):
npm run build && npm run export
# → ./out/ — deploy to any static host (Vercel, Netlify, Cloudflare Pages, S3)
```

### Running Tests

```bash
npm run test           # Vitest unit + integration
npm run test:e2e       # Playwright (starts dev server automatically)
npm run test:coverage  # Vitest with coverage report
npm run lighthouse     # Lighthouse CI audit against localhost
```

---

## Features

### Available Now (MVP)

- **Daily canvas** — notes automatically grouped by date; navigate days with arrow keys or the calendar picker.
- **Markdown editor** — live preview toggle; full CommonMark support; fenced code blocks with syntax highlighting.
- **Rich-text mode** — TipTap-powered WYSIWYG for users who prefer it; switchable per preference.
- **Multilingual typing** — write in any script; language badge per note sets `lang`, `dir`, and font hinting automatically.
- **Tags** — free-form tagging with autocomplete; filter timeline by tag.
- **Full-text search** — fuzzy search across all notes via command palette (`⌘K`).
- **Export / Import** — download all notes as JSON or a Markdown zip; import a previously exported bundle.
- **Dark / light / system theme** — respects `prefers-color-scheme`; manually overridable.
- **Fully accessible** — WCAG 2.1 AA; keyboard-navigable; screen-reader tested.

### Planned (Roadmap)

| Feature | Milestone |
|---------|-----------|
| IndexedDB adapter + Service Worker (PWA / offline) | M5 |
| AI bot (Q&A, day summary, tag suggestions) | M4 |
| Multilingual app UI (Telugu, Hindi, Japanese, Arabic) | M3 |
| Version history with diff viewer | Post-M6 |
| Cloud sync via pluggable backend adapter | Post-M6 |
| Real-time collaboration (Yjs) | Future |
| Reminders and due-date notifications | Future |
| Data analytics dashboard | Future |

---

## Using the AI Bot

> The AI bot is **disabled by default**. Enabling it requires an API key for an OpenAI-compatible service. Your notes are never sent anywhere without your explicit action.

### Setup

1. Open **Settings → AI Assistant**.
2. Toggle **Enable AI bot** — read and accept the data consent notice.
3. Enter your API endpoint, model name, and API key:
   - **OpenAI:** `https://api.openai.com/v1`, model `gpt-4o-mini`
   - **Ollama (local):** `http://localhost:11434/v1`, model `llama3`
   - **Azure OpenAI:** your deployment URL
4. Click **Save** — the bot panel appears in the sidebar.

### How It Works

1. You type a question in the bot panel.
2. DayNote searches your notes locally (Fuse.js) for the most relevant excerpts — up to ~3,000 tokens.
3. Those excerpts (not your full note corpus) plus your question are sent to the configured AI endpoint.
4. The answer streams back into the chat, with citations referencing note dates and headings.

**Your API key is stored only in your browser's `localStorage`. It is never sent to DayNote's servers.**

### Example Queries

```
"What did I decide about the project architecture last week?"
"Summarise my notes from March 2025."
"Which notes mention async/await?"
"Suggest tags for today's note."
```

### Privacy Controls

- You can disable the bot at any time from Settings; the bot panel disappears immediately.
- Clearing app data (Settings → Storage → Clear All) removes the API key along with all notes.
- For maximum privacy, point the endpoint at a local Ollama instance — no data ever leaves your machine.

---

## Contributing

All contributions are welcome — bug reports, feature requests, documentation improvements, and code PRs.

### Quick Start

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/daynote.git
cd daynote
npm install
git checkout -b feat/your-feature-name
```

### Workflow

1. **Branch naming:** `feat/`, `fix/`, `docs/`, `chore/` prefixes.
2. **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/) — e.g. `feat(editor): add RTL auto-detection`.
3. **Tests:** Add or update tests for any changed behaviour. `npm run test` must pass.
4. **Lint:** `npm run lint` must pass with zero errors (`eslint` + `prettier`).
5. **PR description:** Fill in the PR template — what changed, why, and how to test it manually.
6. **Review:** At least one maintainer approval required before merge.
7. **CI:** All GitHub Actions checks must be green (type-check, lint, tests, Lighthouse budget).

### Reporting Issues

Use GitHub Issues. For bugs, include: OS, browser version, steps to reproduce, and (if safe to share) an export of the relevant notes.

### Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). Be kind.

---

## License and Contact

**License:** [MIT](LICENSE) — free to use, modify, and distribute with attribution.

**Maintainer:** your-name — [your@email.com](mailto:your@email.com)

**GitHub:** [https://github.com/your-org/daynote](https://github.com/your-org/daynote)

**Issues / Discussions:** GitHub Issues and Discussions tabs on the repo.

---

*DayNote — write freely, in any language, any day.*
