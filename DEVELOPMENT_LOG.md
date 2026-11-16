# Development Log

## 2026-11-17: Step 3: AI audio with switchable models

**Requirement:** audio from recognised AI models that support Māori; learners can switch models.

**Research** ([docs/tts-provider-research.md](docs/tts-provider-research.md)): ElevenLabs v4/v3 list Māori and are usable now. Papa Reo is Māori-built but needs an access application (Kaitiakitanga License). OpenAI TTS lists Maori but shuts down 2027-01-06. Gemini TTS and Azure have no Māori.

**Built**
- `services/tts/`: `TextToSpeechModel` interface; ElevenLabs adapter; registry that only offers models with keys set *and* support for the language.
- `services/audio-cache/`: cache keyed by sha256(model + voice + language + NFC text); filesystem implementation for development.
- `GET /api/tts?sentence=&model=`: zod-validated; **ids only, never free text**; only visible sentences; generic errors to the browser, details in server logs; cache HIT/MISS header.
- Reader: model switcher (choice remembered in localStorage), speed 0.5–1.25× (browser `playbackRate`, so no regeneration cost), play line, play whole conversation (auto-advances), highlight of the playing line, "AI-generated audio · may contain errors" label. All audio controls are hidden when no model is configured.
- `Sentence.language` added. `.env.example` added. `zod` and `server-only` dependencies added.

**Tested:** 26 unit tests pass (adapter request format with a mocked network, registry, no key leakage, cache, endpoint rules). Lint and build are clean; the build warning about filesystem tracing was fixed. On a running server: with no keys, audio controls are hidden and the endpoint returns 404; with fake keys, v4/v3 appear, no secrets are in the HTML, a real call reaches ElevenLabs and gets `401 invalid_api_key`, the learner sees a generic 502, and a non-Māori model is refused.

**Not yet tested:** real audio generation and playback in a browser (needs a real ElevenLabs key), and the quality of the Māori pronunciation.

**Known limitations:** the filesystem cache doesn't persist on Vercel (Supabase Storage later). There's no rate limiting yet, but cost is bounded because only known sentences can be synthesised and each is cached.

## 2026-11-17: Step 2: conversation reading screen

**Decision:** build the screen with AI-written **sample** content (option b), clearly labelled and hidden in production.

**Built**
- Shared content types (`src/features/content/types.ts`): `Sentence`, `VocabularyItem`, `VerificationStatus`, `Difficulty`, `Provenance`. They mirror DATABASE_SCHEMA.md.
- Conversation types and a **repository** (`src/features/conversations/repository.ts`). Pages get data only through it, so moving to Supabase later only changes this file.
  - Lines reference sentences by id: the sentence stays the reusable unit.
  - Vocabulary is *derived* from a conversation's sentences, not stored twice.
- `/conversations/[topic]/[conversation]`: dialogue (speakers alternate sides), a global "show all translations" toggle plus per-line "Show English", vocabulary, learning notes, source, verification badge, and a sample warning banner.
- The topic page lists its conversations in level order.
- `VerificationBadge` component; `warn` colour tokens.
- Sample gating: `sampleContentEnabled()` is true in dev/test and false in production unless `SHOW_SAMPLE_CONTENT=true`.
- Vitest with 11 tests: data integrity (lines resolve, vocab ids exist, unique ids/slugs/levels, topics exist), sample content never marked verified, and gating.

**Fixes along the way**
- `@types/node` raised from 20 to 24 (needed by Vitest; Node 24 is LTS).
- Next.js 16 Cache Components: `generateStaticParams` must return at least one entry, so when there are no conversations it returns a placeholder that resolves to not-found.
- Moved `await params` inside `<Suspense>` on both dynamic pages, fixing a dev warning about non-instant navigation.

**Tested:** `npm test` (11 passed), lint, production build. In dev, every page renders the expected content and unknown URLs carry Next's 404 marker. In production, the sample is hidden and the topic shows the empty state. **Not yet tested in a real browser:** clicking the translation toggles (the code is simple, but no browser automation is set up).

## 2026-11-17: Step 1: scaffold + conversation topics

**Direction change:** focus on topics/conversations; grammar is deferred.

**Built**
- Next.js 16.4 (App Router, Turbopack, Cache Components) + React 19 + TypeScript + Tailwind 4 + ESLint.
- Design tokens in `src/app/globals.css` (light and dark).
- `SiteHeader`, which only shows sections that exist (Conversations for now).
- `/conversations` lists the 14 topics from the brief. `/conversations/[topic]` is pre-rendered per topic and shows an honest "no conversations yet" message.
- Topics live in `src/features/conversations/topics.ts` until the database exists. They are English-only, and Māori topic names will be added once verified.

**Tested:** lint passes; production build passes; `next start` serves `/`, `/conversations` and every topic page; an unknown topic shows "Topic not found".

**Known limitation:** an unknown topic URL renders the not-found page with HTTP **200** (plus a `noindex` tag) rather than 404. This is documented Next.js 16 behaviour when Cache Components stream a page, and `dynamicParams = false` isn't allowed in this mode. Revisit if it matters.

## 2026-11-17: Phase 1: inspection and planning

**Findings**
- GitHub repo `SteffanThorn/2nd-voice-claude` is empty (no commits), so this is a greenfield build.
- Tooling: Node 26, npm 11, git, gh are present. Supabase CLI, Docker and Vercel CLI are not installed.
- Anki grammar deck analysed: 1,047 sentences, 189 structures. Most example sentences are quoted from dictionaries and published texts. See [docs/anki-import-analysis.md](docs/anki-import-analysis.md).

**Proposed decisions**
- Next.js App Router + TypeScript + Tailwind + Supabase + Vercel. No ORM at first.
- FSRS scheduling via `ts-fsrs` behind a `Scheduler` interface.
- The sentence is the reusable content atom. The "exactly-one target" pattern is used for polymorphic links.
- Verification status is separate from publication status. Imported content starts as unverified.

**Open questions for the project owner**
1. Which Anki files make up "the grammar deck": Part 1 only, or also Part 2 and the small sentence sheets?
2. Can learners see unverified content with a clear badge, or must content be verified before publishing?
3. How should the dictionary-sourced example sentences be handled (permission vs original replacements)?
4. Development database: hosted Supabase project, or local via Docker?
