# Roadmap

✅ done · 🔄 in progress · ⬜ not started

## Phase 1: Inspect and plan 🔄
- ✅ Inspect repository (empty) and local tooling
- ✅ Analyse existing Anki grammar deck
- ✅ Propose architecture, database schema, risks
- ⬜ Confirm open decisions (see DEVELOPMENT_LOG, 2026-11-17)

> **Current focus (2026-11-17):** topics and conversations first. Grammar (and the Anki import) is deferred until the Conversations section works end to end.

## Phase 2: Foundation
1. ✅ Scaffold Next.js 16 + TypeScript + Tailwind + ESLint (Vitest to be added with the first real logic)
1a. ✅ Conversations: topic list + topic pages (static data, honest empty state)
1b. ✅ Conversation data model + reading screen (show/hide translations, vocabulary, notes, source, verification badge) using dev-only sample content; Vitest added
1c. ✅ AI audio: TTS provider interface, ElevenLabs v4/v3 adapter, learner model switcher, play line / play conversation, speed control, audio cache (local filesystem)
1d. ⬜ Add ElevenLabs key and check real Māori output with a fluent speaker · apply for Papa Reo access · production audio cache (Supabase Storage) · rate limiting
1e. ⬜ Next candidates: first real (human-verified) conversation · sequential level locking (needs accounts) · simple exercises from a conversation
2. ⬜ Supabase project + client helpers (server / browser / admin)
3. ⬜ Migration 1: languages, profiles, roles, user_languages, RLS
4. ⬜ Auth (email magic link or password), sign-in/out, protected routes
5. ⬜ App shell: 4-section navigation, responsive layout, design tokens and base UI components
6. ⬜ Language selection + Profile page (real data)
7. ⬜ Deploy to Vercel (preview + production)

## Phase 3: Core learning
- ⬜ Migration 2: content, provenance, verification, pathways
- ⬜ Admin area + role checks
- ⬜ Import pipeline (upload → parse → preview → dedupe → validate → difficulty → approve → import, with a log)
- ⬜ Verification workflow UI
- ⬜ Grammar section (categories → structures → lessons, sequential levels)
- ⬜ Exercise engine (generators + components), starting with fill-gap, select translation, reconstruct, identify structure
- ⬜ Conversations section, with the first original conversations (human-verified)

## Phase 4: Revision
- ⬜ Scheduler interface + FSRS implementation + tests
- ⬜ Review items created from lessons and conversations
- ⬜ Review session (Again / Hard / Good / Easy) with contextual recall
- ⬜ Dashboard: due, overdue, upcoming, learning, retention; daily caps

## Phase 5: Memory associations
- ⬜ Personal associations (CRUD, shown in revision)
- ⬜ Community sharing, likes, bookmarks, sorting, reports
- ⬜ Moderation tools

## Phase 6: Audio and speech
- ⬜ Audio storage + player (per line, full conversation, speed)
- ⬜ Recorded human audio workflow
- ⬜ Benchmark Māori TTS/STT providers before adopting any
- ⬜ Speaking practice (record and compare); pronunciation feedback only if a benchmark supports it

## Phase 7: Expansion
- ⬜ Analytics, UX polish
- ⬜ Mandarin (romanisation/pinyin, characters), Spanish
