# Architecture

Status: **proposed (Phase 1)**. Decisions marked *(open)* need confirmation.

## 1. Starting point

The GitHub repository was empty when inspected on 2026-11-17: no commits, no files. There is no existing code to preserve, so the stack below is a fresh choice rather than a migration.

Local tooling found: Node 26, npm 11, git, GitHub CLI. **Not installed:** Supabase CLI, Docker, Vercel CLI. The Supabase CLI can run through `npx supabase` without a global install. Docker is only needed for a fully local database (see §8).

## 2. Stack and why

| Concern | Choice | Reason |
|---|---|---|
| Framework | **Next.js (App Router) + React + TypeScript** | Handles UI and server code in one project; deploys to Vercel; strong typing catches mistakes early |
| Styling | **Tailwind CSS** | Consistent design tokens and no separate CSS files to maintain |
| Database | **Supabase Postgres** | Relational data (this project is very relational); Row Level Security; migrations; standard Postgres, so it stays portable |
| Auth | **Supabase Auth** via `@supabase/ssr` | Cookie-based sessions that work in server components |
| Files | **Supabase Storage** | Audio and association images, with access policies |
| Validation | **zod** | One schema validates both the server input and the TypeScript types |
| Scheduling | **FSRS** via `ts-fsrs` (MIT) behind our own `Scheduler` interface | Modern evidence-based algorithm; more efficient than the classic SM-2. Anki itself is AGPL, so we don't copy its code |
| CSV parsing | `papaparse` | Handles quoted multi-line fields and the messy CSVs we actually have |
| Tests | **Vitest** (unit), Playwright later (end-to-end) | The scheduler, importer and exercise generators are pure logic and easy to unit test |
| Hosting | **Vercel** + Supabase cloud | Push to GitHub and it deploys |

We are deliberately **not** using an ORM (Prisma/Drizzle) at first. Supabase generates TypeScript types straight from the database, and RLS works best when queries run as the user. That means one less layer to learn.

## 3. Key concepts (short explainer)

- **Server Components** (the default in Next.js) run on the server. They can read the database directly and send finished HTML to the browser. Use them for reading content.
- **Client Components** (`"use client"`) run in the browser. Use them for interactivity: audio players, exercises, flip cards.
- **Server Actions / Route Handlers** are server functions the browser calls to *change* data (submit a review, save an association). Every one of them validates input with zod and checks permissions.
- **Row Level Security (RLS)** means Postgres itself refuses a query like "update another user's association", even if our code has a bug. Frontend checks are for UX; RLS is for security.
- **Environment variables** hold secrets in `.env.local` (never committed). Only variables prefixed `NEXT_PUBLIC_` reach the browser, so the Supabase *service-role* key never gets that prefix.

## 4. Folder structure (planned)

```
src/
  app/                        # Routes (Next.js App Router)
    (learn)/conversations/    # Conversations section
    (learn)/grammar/          # Grammar section
    (learn)/revision/         # Revision section
    (learn)/profile/          # Profile section
    admin/                    # Admin: imports, verification, moderation
    auth/                     # Sign-in / callback
  components/
    ui/                       # Design-system primitives (Button, Card, …)
    exercises/                # One component per exercise type
    audio/                    # Player, speed control
  features/                   # Domain logic grouped by feature
    conversations/  grammar/  revision/  associations/  import/  verification/
  lib/
    supabase/                 # server.ts, client.ts, admin.ts (server-only)
    validation/               # zod schemas
  services/                   # Swappable providers (see §5)
    scheduler/  tts/  stt/  pronunciation/  ai/
  types/database.ts           # Generated from Supabase
supabase/
  migrations/                 # Versioned SQL (the schema history)
  seed.sql                    # Dev seed data (original content only)
tests/
```

## 5. Provider interfaces (avoid lock-in)

Each external capability is a TypeScript interface. The app only imports the interface; a config value picks the implementation.

```ts
interface Scheduler {            // services/scheduler
  next(card: CardState, rating: Rating, now: Date): ScheduleResult;
  preview(card: CardState, now: Date): Record<Rating, Date>;
}
interface TextToSpeech {          // services/tts
  synthesize(text: string, opts: { lang: LangCode; voice?: string; rate?: number }): Promise<AudioResult>;
}
interface SpeechToText {          // services/stt
  transcribe(audio: Blob, lang: LangCode): Promise<Transcript>;
}
interface PronunciationAssessor { // services/pronunciation; only if a provider genuinely supports the language
  assess(audio: Blob, reference: string, lang: LangCode): Promise<PronunciationReport>;
}
interface LanguageAssistant {     // services/ai; grounded in approved content only
  explain(itemId: string, question: string): Promise<GroundedAnswer>;
}
```

Rules: provider keys live only on the server. AI output is stored as **suggestions** and never written into verified content tables or user associations.

## 6. Content model principles

- **The sentence is the reusable atom.** A sentence is stored once and linked to vocabulary, grammar structures, conversation lines, exercises and audio. Fixing a translation fixes it everywhere.
- **Language-specific content** (sentences, vocabulary, grammar) carries a `language_id`. **Shared functionality** (users, reviews, associations, imports, verification) is language-agnostic.
- **Verification is separate from publication.** An item has a `verification_status` and a `publication_status`. Learners see published items only. *(open: whether unverified items may be published with a visible "unverified" badge.)*
- **Exercises are generated from content** where possible: a fill-the-gap exercise comes from a sentence plus its highlighted grammar span. Only hand-authored items, like comprehension questions, are stored as rows. Adding an exercise type means adding a generator and a component, not editing every lesson.
- **Pathways** are generic: a pathway is an ordered list of steps (conversations or grammar lessons) with a level. Progress is per user per step, which keeps every pathway independent.

## 7. Security model

- Roles: `learner` (default), `reviewer` (can change verification status), `admin` (imports, publishing, moderation, roles).
- Roles are stored in `profiles.role`. Users cannot change their own role (enforced by RLS and a trigger).
- All writes go through server actions that validate input (zod), check auth/role, and rely on RLS as the final guard.
- The service-role client lives in `lib/supabase/admin.ts` with `import "server-only"`, so a browser bundle that imports it fails the build.
- Uploads (CSV, images, audio) are checked for MIME type, size and extension. CSVs are parsed server-side, never executed. User text is rendered as text, never as raw HTML. Imported Anki HTML is sanitised and reduced to plain text plus highlight spans.
- Rate limiting starts with simple per-user limits on community actions (likes, reports, association creation), enforced in Postgres. A dedicated service comes later if needed.

## 8. Environments *(open)*

- **Recommended:** a free hosted Supabase project for development, plus `npx supabase` for migrations. No Docker needed.
- Alternative: Docker Desktop with `supabase start` for a fully local database. More setup, works offline.
- Production: a separate Supabase project and Vercel deployment, added in Phase 2 once there's something to deploy.

## 9. Risks

| Risk | Mitigation |
|---|---|
| **Copyright of imported example sentences.** About 95% of the grammar deck's sentences are quoted from Te Aka / dictionary.maori.nz, and others come from the Bible or published books | Import as internal reference material; don't publish to learners until licensing is resolved or original replacement sentences are written (see analysis doc) |
| Māori speech recognition and pronunciation assessment may be poor | Benchmark in Phase 6 before building features on it; ship recorded human audio first |
| AI-generated Māori presented as fact | Verification workflow; AI output can't reach the verified/published state without a human |
| Scope is very large | Strict phases; each phase ends with working, tested software |
| Learning curve | Small steps, explained as we go; tests guard the logic |
