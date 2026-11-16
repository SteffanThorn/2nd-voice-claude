/**
 * Content types shared by every section (conversations, grammar, revision).
 * They mirror the planned database tables in DATABASE_SCHEMA.md so that
 * swapping static data for Supabase later only changes the data-loading code.
 */

/** ISO 639-1 language codes the platform knows about. */
export type LangCode = "mi" | "zh" | "es" | "en";

export type VerificationStatus =
  | "unverified"
  | "under_review"
  | "verified"
  | "needs_revision"
  | "rejected";

export type Difficulty =
  | "beginner_1"
  | "beginner_2"
  | "beginner_3"
  | "intermediate_1"
  | "intermediate_2"
  | "advanced";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner_1: "Beginner 1",
  beginner_2: "Beginner 2",
  beginner_3: "Beginner 3",
  intermediate_1: "Intermediate 1",
  intermediate_2: "Intermediate 2",
  advanced: "Advanced",
};

/** The reusable atom: one sentence, stored once, linked from many places. */
export type Sentence = {
  id: string;
  language: LangCode;
  text: string;
  translation: string;
  vocabularyIds: string[];
  verificationStatus: VerificationStatus;
};

export type VocabularyItem = {
  id: string;
  headword: string;
  translation: string;
  explanation?: string;
  verificationStatus: VerificationStatus;
};

/** Where a piece of content came from. Never fabricated. */
export type Provenance = {
  description: string;
  url?: string;
};
