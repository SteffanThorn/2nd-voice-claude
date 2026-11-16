# 2nd Voice

A multilingual language-learning platform built around structured conversations, grammar, vocabulary, memory associations and spaced repetition. The first language is **te reo Māori**. Mandarin Chinese and Spanish are planned.

> **Status:** early foundation. The Conversations section has 14 topics × 3 levels (Beginner 1 → Intermediate 1) as a gamified pathway, with AI-created, clearly labelled content and optional AI audio. Grammar is deferred. See [ROADMAP.md](ROADMAP.md).

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

## Content status

All conversations are **AI-created (Claude Opus 5.5)** and **unverified**. Each line shows "AI-created with xx% confidence of language logic". That number is the AI's own estimate, not an expert review. Content lives in `src/features/conversations/content/`. A Māori language expert should review it before anyone relies on it.

Learner progress (XP, streaks, unlocked levels) is stored **in the browser** until accounts exist.

## Setup

Requires Node.js 20 or later.

```bash
npm install        # install dependencies
npm run dev        # start the dev server at http://localhost:3000
npm test           # unit tests (Vitest)
npm run test:e2e   # browser tests (Playwright; builds the app and serves it on port 3210)
npm run lint       # check code style and common mistakes
npm run build      # production build (also type-checks)
```

### Environment variables
Copy `.env.example` to `.env.local` and fill it in. Never commit `.env.local`.

| Variable | Needed for |
|---|---|
| `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID` | AI audio (ElevenLabs v4 / v3). Without any voice configured, audio controls are hidden |
| `GOOGLE_TTS_API_KEY` (+ optional `GOOGLE_TTS_LANGUAGE_CODE`, `GOOGLE_TTS_VOICE_NAME`) | **Experimental** Google Cloud voice: reads Māori with a borrowed voice (Spanish by default) |
| `ESPEAK_NG_ENABLED=true` | **Experimental** eSpeak NG voice: free, built-in Māori rules, robotic. No key needed |

Restart `npm run dev` after changing `.env.local`. For a production build, these must be set **at build time** (the voice list is baked into pre-built pages).

Generated audio is cached in `.cache/tts/` (git-ignored) during local development. See [docs/tts-provider-research.md](docs/tts-provider-research.md) for which speech providers support Māori.