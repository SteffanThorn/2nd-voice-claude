# Database Schema

Status: **proposed (Phase 1)**. It becomes SQL migrations in Phase 2. Every table has `id uuid primary key default gen_random_uuid()` and `created_at`/`updated_at` unless noted.

## Conventions

- **Content tables** (language-specific) share these columns: `language_id`, `verification_status`, `publication_status (draft | published | archived)`, `difficulty`, `created_by`.
- **Enums**
  - `verification_status`: unverified · under_review · verified · needs_revision · rejected
  - `difficulty`: beginner_1 · beginner_2 · beginner_3 · intermediate_1 · intermediate_2 · advanced
  - `role`: learner · reviewer · admin
- **"Exactly-one target" pattern.** Some tables can point at *one of several* kinds of thing; a review item can be a word, a sentence or a grammar structure. Instead of a vague "type + id" pair (which the database can't check), these tables have one nullable foreign key per kind plus a `CHECK` that exactly one is set. The database then guarantees the referenced item exists. It's used by `review_items`, `memory_associations`, `citations`, `audio_assets` and `verification_records`.

## Entity overview

```
languages ─┬─ vocabulary_items ─┐
           ├─ sentences ────────┼── sentence_vocabulary (sentence ↔ vocab)
           │      │             └── sentence_grammar    (sentence ↔ structure, + highlight spans)
           ├─ grammar_categories ── grammar_structures ── grammar_lessons ── grammar_lesson_sentences
           ├─ conversations ── conversation_characters
           │        └── conversation_lines ──> sentences
           └─ pathways ── pathway_steps ──> conversation | grammar_lesson
topics (shared)
audio_assets ──> vocab | sentence | conversation_line | conversation
content_sources ── citations ──> vocab | sentence | structure | conversation
verification_records ──> (same targets)       (append-only audit trail)
profiles ── user_languages
         ├─ user_step_progress ──> pathway_steps
         ├─ exercise_attempts
         ├─ review_items ──> vocab | sentence | structure | conversation_line
         │       └─ review_logs                (append-only)
         └─ memory_associations ──> vocab | sentence | structure
                 ├─ association_likes / association_bookmarks
                 └─ content_reports
import_batches ── import_records ──> created sentence / structure ids
```

## Tables

### Users and languages
| Table | Key columns |
|---|---|
| `profiles` | `id` = `auth.users.id`, `display_name`, `role`, `ui_settings jsonb` |
| `languages` | `code` ('mi', 'zh', 'es'), `name`, `native_name`, `is_active`, `uses_romanization` (for pinyin) |
| `user_languages` | `user_id`, `language_id`, `is_current`; PK (user_id, language_id) |

### Core content
| Table | Key columns |
|---|---|
| `topics` | `slug`, `name`, `sort_order`. Shared across languages ("home", "work") |
| `vocabulary_items` | `headword`, `translation`, `explanation`, `part_of_speech`, `romanization`, `topic_id`, `fingerprint` (unique per language) |
| `sentences` | `text`, `translation`, `romanization`, `notes`, `fingerprint` (unique per language: hash of normalised text) |
| `sentence_vocabulary` | `sentence_id`, `vocabulary_item_id`, `surface_form`, `char_start`, `char_end` |
| `sentence_grammar` | `sentence_id`, `grammar_structure_id`, `spans jsonb` (highlighted character ranges) |
| `grammar_categories` | `slug`, `name`, `description`, `sort_order` |
| `grammar_structures` | `category_id`, `stable_key` (unique), `pattern` ("ki te…"), `title`, `explanation`, `usage_notes` |
| `grammar_lessons` | `grammar_structure_id`, `level`, `title`, `body` (markdown), `sort_order` |
| `grammar_lesson_sentences` | `lesson_id`, `sentence_id`, `role` (example / exercise), `sort_order` |
| `conversations` | `topic_id`, `title`, `description`, `learning_notes` |
| `conversation_characters` | `conversation_id`, `name`, `description` |
| `conversation_lines` | `conversation_id`, `position`, `character_id`, `sentence_id` |
| `exercises` | `type`, `config jsonb` (validated by zod per type), optional source FK. **Hand-authored exercises only**; generated ones aren't stored |
| `lesson_exercises` | links exercises to a conversation or grammar lesson with an order |
| `audio_assets` | target (exactly one), `storage_path`, `duration_ms`, `voice_label`, `speaker_name`, `is_synthetic`, `provider`, `licence` |

A conversation's vocabulary and grammar are **derived** from its lines' sentences, so nothing is duplicated.

### Pathways and progress
| Table | Key columns |
|---|---|
| `pathways` | `language_id`, `kind` (conversation_topic / grammar), `topic_id` or `grammar_category_id`, `title` |
| `pathway_steps` | `pathway_id`, `level`, `position`, `conversation_id` or `grammar_lesson_id` (exactly one) |
| `user_step_progress` | `user_id`, `step_id`, `status` (in_progress / completed), `best_score`, `completed_at` |
| `exercise_attempts` | `user_id`, exercise reference, `is_correct`, `response jsonb` |

Unlock rule: step *n* is available when step *n−1* in the **same pathway** is completed. This is computed, not stored.

### Revision (spaced repetition)
| Table | Key columns |
|---|---|
| `review_items` | `user_id`, target (exactly one of vocab / sentence / structure / conversation_line), `mode` (recognition / production / listening / speaking), `origin_conversation_id`, `origin_lesson_id` (for contextual recall), scheduler state: `state` (new / learning / review / relearning), `due`, `stability`, `difficulty`, `reps`, `lapses`, `last_reviewed_at`, `suspended`. Unique per (user, target, mode) |
| `review_logs` | `review_item_id`, `user_id`, `rating` (again/hard/good/easy), `state_before`, `reviewed_at`, `prev_interval_days`, `new_interval_days`, `due_after`, `duration_ms`. **Append-only** |

Success and failure counts come from `reps`/`lapses` and the logs, so they aren't stored separately. Because the logs keep full history, the scheduler can be swapped or re-optimised later.

### Memory associations
| Table | Key columns |
|---|---|
| `memory_associations` | `user_id`, `language_id`, target (vocab / sentence / structure), `kind` (text / sound_alike / humour / story / visual), `body`, `image_path`, `visibility` (private / community), `moderation_status` (visible / hidden / removed), `like_count` (kept up to date by a trigger) |
| `association_likes` | PK (`user_id`, `association_id`) |
| `association_bookmarks` | PK (`user_id`, `association_id`) |
| `content_reports` | `reporter_id`, `association_id`, `reason`, `status` (open / actioned / dismissed), `resolved_by` |

### Provenance and verification
| Table | Key columns |
|---|---|
| `content_sources` | `title`, `author_or_org`, `source_type` (book / dictionary / corpus / website / original / anki_deck), `url`, `licence_notes`, `permission_status` (not_needed / unknown / requested / granted / denied) |
| `citations` | `source_id`, target (exactly one), `locator` (page, section, verse), `url` |
| `verification_records` | target, `from_status`, `to_status`, `reviewer_id`, `note`. **Append-only.** A trigger keeps the item's `verification_status` in sync and refuses `verified` unless the reviewer is a human with the reviewer or admin role |

### Import
| Table | Key columns |
|---|---|
| `import_batches` | `language_id`, `filename`, `file_sha256`, `format` (anki_csv / anki_txt / simple_csv), `uploaded_by`, `status`, counts |
| `import_records` | `batch_id`, `row_number`, `raw jsonb`, `parsed jsonb`, `issues jsonb`, `fingerprint`, `proposed_difficulty`, `status` (pending / approved / rejected / duplicate / imported), `decided_by`, `created_sentence_id`, `created_structure_id` |

**Re-runnable imports:** a sentence's `fingerprint` (a hash of the language plus the normalised Māori text) is unique, so re-importing the same sentence links to the existing row instead of creating a duplicate. Grammar structures match on `stable_key`. Uploading the same file twice is detected through `file_sha256`.

## Row Level Security summary

| Data | Read | Write |
|---|---|---|
| Published content | everyone (including signed-out users, *open*) | admin only |
| Draft or unverified content | reviewer, admin | admin (reviewers change status only) |
| Own progress, reviews, logs | owner | owner, through server actions |
| Private associations | owner | owner |
| Community associations | signed-in users, if `moderation_status = visible` | owner edits; admin moderates |
| Likes, bookmarks, reports | owner (admins see reports) | owner |
| Import tables, verification records | reviewer, admin | admin / reviewer |
| `profiles.role` | owner | admin only |
