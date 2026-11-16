# 2nd Voice

A multilingual language-learning platform built around structured conversations, grammar, vocabulary, memory associations and spaced repetition. The first language is **te reo Māori**. Mandarin Chinese and Spanish are planned.

> **Status:** early foundation. The Conversations section lists topics; no lessons yet. Current focus is **topics/conversations**, with grammar deferred. See [ROADMAP.md](ROADMAP.md).

## Documentation

| File | Purpose |
|---|---|
| [PROJECT_SPEC.md](PROJECT_SPEC.md) | What the product does and the rules it must follow |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Technology choices, code structure, service interfaces |
| [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) | Tables, relationships, security (RLS) |
| [ROADMAP.md](ROADMAP.md) | Phased plan and current progress |
| [DEVELOPMENT_LOG.md](DEVELOPMENT_LOG.md) | Dated record of decisions and changes |
| [docs/anki-import-analysis.md](docs/anki-import-analysis.md) | Analysis of the existing Māori grammar Anki deck |

## Planned stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Supabase (PostgreSQL, Auth, Storage) · Vercel

## Setup

Requires Node.js 20 or later.

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:3000
npm test           # run automated tests (Vitest)
npm run lint       # check code style and common mistakes
npm run build      # production build (also type-checks)
```

### Environment variables
Copy `.env.example` to `.env.local` and fill it in. Never commit `.env.local`.

| Variable | Needed for |
|---|---|
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | AI audio (ElevenLabs v4 / v3). Without them, audio controls are hidden |
| `SHOW_SAMPLE_CONTENT` | Optional: show sample content in production |

Generated audio is cached in `.cache/tts/` (git-ignored) during local development. See [docs/tts-provider-research.md](docs/tts-provider-research.md) for which speech providers support Māori.

### Sample content
`src/features/conversations/sample-data.ts` holds an **unverified, AI-written** sample conversation (Meeting people → First introductions). It exists only to build the UI. It shows in `npm run dev` and is **hidden in production builds**. To show it in production deliberately, set `SHOW_SAMPLE_CONTENT=true`.
