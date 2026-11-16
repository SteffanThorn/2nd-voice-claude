# 2nd Voice — Project Specification

This is a condensed version of the product brief. It is the source of truth for **what** we are building. [ARCHITECTURE.md](ARCHITECTURE.md) covers **how**.

## Purpose

Help learners **understand, remember and use** a language through meaningful context and repeated encounters. The primary experience is structured, curated learning content. It is **not** a chatbot.

- Initial language: te reo Māori.
- Future languages: Mandarin Chinese, Spanish. The core platform must support them without a rebuild.

## Navigation (4 sections)

1. **Conversations**: a library of prepared dialogues grouped by topic.
2. **Grammar**: grammar categories and structures.
3. **Revision**: spaced-repetition review and a dashboard.
4. **Profile**: languages, progress, associations, settings.

Difficulty is **not** a navigation section. Learners choose any topic or grammar category freely. Within each pathway (for example *Home*, *Work*, *Kei te* or *Possessives*), levels unlock sequentially. Each pathway is independent, so finishing one never unlocks another.

## Learning principles

- **Context first.** Vocabulary is introduced inside sentences and conversations. Isolated drills are for revision.
- **Multiple senses** where they help: reading, listening, speaking, writing, images.
- **Personal memory associations**, such as *poto* = short → "a short flower pot". They are linked to the item, saved to the account, editable and deletable, shown in revision, and **never overwritten by AI**.
- **Varied repetition**: read → listen → identify → fill gap → reconstruct → speak → review → meet again in another context.

## Conversations

Each conversation has a title, topic, difficulty, characters, the full dialogue (Māori with English translation), vocabulary, grammar concepts, learning notes, per-line audio, full audio, and source/verification information.

Learners can toggle translations, play a single line or the whole conversation, change playback speed, practise speaking, and jump to related grammar and vocabulary.

Initial topics: everyday life, home, family, work, sports, leisure, cafés and restaurants, shopping, travel, meeting people, talking with children, talking with elderly people, health and wellbeing, social situations.

## Exercise engine (reusable, extensible)

Exercise types: fill in the missing word · identify a Māori word · select translation · match sentences · reconstruct a shuffled sentence · identify grammar structure · listen and identify · comprehension questions · speak aloud · vocabulary recall.

## Grammar

Categories include tense/time markers, pronouns, possessives, sentence structures, verbs, prepositions, conjunctions, questions and negation. Example structures: kei te, i te, kua, ka, tāku/tōku, nāku/nōku, nā te…, nā runga i…, ki a au nei, ki te, mā reira.

Each lesson covers the structure, an explanation, when and why to use it, verified examples with translations, vocabulary, audio, sentence construction, and recognition, listening and speaking exercises. Lessons also feed revision items.

The **existing Māori grammar Anki deck** is a foundational source. It is imported through an admin review pipeline, not copied straight in. Details are in [docs/anki-import-analysis.md](docs/anki-import-analysis.md).

Difficulty bands (provisional, adjustable by admins): Beginner 1–3, Intermediate 1–2, Advanced.

## Revision

- Our own spaced-repetition engine. No Anki branding or code.
- Ratings: **Again / Hard / Good / Easy**.
- States: new → learning → review, plus relearning after a lapse.
- Item types: vocabulary, sentences, grammar structures, conversation lines, listening, spoken production.
- When an item is forgotten, show the context it originally came from.
- Dashboard shows: due today, overdue, upcoming, learning, progress and retention. Daily queues are capped so they don't overwhelm.

## Memory associations

- **Personal** associations are private.
- **Community** associations are opt-in. Others can browse, like, bookmark, sort (newest/popular) and report them.
- They are always visually distinct from authoritative definitions. **Popularity ≠ correctness.**
- Admins have moderation tools.

## Content verification (Māori)

Statuses: **Unverified · Under review · Verified · Needs revision · Rejected**.

- AI never marks anything as verified. That requires a human reviewer.
- Each item records its source, author/organisation, page/section, URL, reviewer and review date.
- References are **never fabricated**.

Trusted references include Māori Made Easy 1 & 2, Let's Learn Māori, Te Whanake, Tūmahi Māori, Te Reo Māori: The Basics Explained, A Māori Reference Grammar, Māori at Work, Māori at Home, the Raupō Phrasebook, Te Aka, He Pātaka Kupu and the Ngata Dictionary.

## Copyright

The product may become commercial. Published references are used for **linguistic understanding**, not reproduction.

- Conversations and lessons are original.
- No wholesale or bulk copying of textbook dialogues, example collections or dictionary definitions, and no scraping.
- Attribution does not equal permission. Provenance and licence data is stored for every item.

## Audio, speech, AI

These are four separate, swappable services: text-to-speech, speech-to-text, pronunciation assessment and AI assistance.

- Māori speech recognition must be benchmarked before we rely on it.
- Speech recognition is not pronunciation assessment.
- AI may help organise content and generate exercise variations from approved content. It must never silently change verified content.

## Profiles

Tracks languages, completed conversations, grammar/vocabulary progress, review history, associations (own and saved) and statistics.

## Non-functional requirements

Security (auth, RLS, server-side validation, rate limiting, safe uploads), mobile-first responsive UI, fast loading, a calm homepage, and no fake or placeholder functionality presented as real.
