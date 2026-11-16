# Anki deck analysis (2026-11-17)

This analysis was done before building the importer. The files were read from `~/Documents` and **have not been copied into this repo**.

## Files found

| File | What it is |
|---|---|
| `TeReo_Part1_grammar_simple.csv` | **Best import source.** Clean columns: `Entry, Target, Grammar, Maori sentence, English, Source, Link` |
| `TeReo_Part1_grammar_anki.csv` | Same content as an Anki export: `#` header lines, HTML, highlight `<span>`s, `raupapa` ordering like `1.1` |
| `TeReo_Part1_grammar_anki (2).csv` | Same, but `raupapa` is `1` instead of `1.1`. **Not identical** to the above |
| `TeReo_Part1_grammar_anki.txt` | Tab-separated variant |
| `*TeReo_Part1_grammar.apkg`, `TeReo_Part2.apkg` | Anki packages (zip + SQLite). Part 2 has no CSV export yet |
| `Nā sentences`, `reira sentences`, `Ki te (if_when) sentences`, `hei_tauira_anki.csv` | Small hand-made `Māori,English` sheets (7–27 rows) |
| Other `.apkg` decks (Māori Made Easy, Top 1000 words, Te Wānanga, L3 Pānui, He Awa Reo) | Not analysed. Several appear to be derived from published books or courses |

## Part 1 grammar deck: profile

- **1,047 sentences** across **189 grammar structures**, with no duplicate sentences and no blank translations.
- Entry numbers run from 1 to 284 **with gaps**, so some entries were removed or never filled.
- The usual set is ~10 sentences per structure; some have only 1–3.
- **Repeated target names under different entries**: `ki te...` (30, 186), `kia...` (35, 187), `i taua wā` (10, 284). The target text alone therefore can't identify a structure. The importer keys on `deck + entry`, and an admin decides whether to merge the duplicates.
- The Anki CSV highlights the target words with `<span>`s in both Māori and English. That's valuable: it gives the exact span for fill-the-gap and identify-the-structure exercises. The importer will turn the spans into `sentence_grammar.spans` and drop the HTML.
- The "Grammar" column is a short explanation per structure (for example, "Concessive: although / even though…").

### Sources of the example sentences

| Source | Sentences |
|---|---|
| dictionary.maori.nz | 709 |
| Te Aka Māori Dictionary | 189 |
| Te Kawenata Hou (Bible, New Testament) | ~120 |
| Ngā Tāngata Taumata Rau, Te Reo o Ngā Toi Ataata, Te Pīpīwharauroa, He Muka, Te Ara, etc. | ~30 |

## Implications

1. **Copyright (important for a commercial product).** Nearly every sentence is quoted from a dictionary or published text. The brief says to avoid "copying large collections of examples" and "copying dictionary definitions wholesale". Proposed handling:
   - Import everything with full provenance (source + URL) and `verification_status = unverified`.
   - Mark the sources `permission_status = unknown`. The publish step is blocked for items whose only source has unknown or denied permission.
   - Use the **structures and explanations** (the deck's own work) as the backbone of the Grammar section, then either seek permission from the dictionary publishers or write original example sentences, verified against those references.
2. **Verification.** Sentences quoted from Te Aka or other dictionaries are likely accurate Māori, but per the brief they still start as *unverified* until a human reviews them.
3. **Difficulty.** The deck has no levels. The importer will *propose* a band from sentence length, structure complexity and the deck's order, and an admin will confirm. That's a suggestion, not a ruling.
4. **Categories.** The 189 structures need assigning to categories (conjunctions, time markers, negation, …). The importer will suggest one from the target text, and an admin will confirm.
5. **Formats.** Support `simple_csv` first, because it's cleanest. Then Anki CSV/TXT (`#` headers + HTML), to recover the highlight spans. `.apkg` support is optional and later.
