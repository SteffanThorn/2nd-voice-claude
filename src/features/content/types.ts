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
  origin: ContentOrigin;
};

/**
 * Who or what produced a piece of content. Shown to learners next to it.
 * For AI content, `confidence` (0–100) is the AI's own estimate of how
 * sound the language logic is. It is NOT a review by a Māori language expert.
 */
export type ContentOrigin =
  | { type: "ai_generated"; model: string; confidence: number }
  | { type: "human"; author: string }
  | { type: "source"; citation: string; url?: string };

export function originLabel(origin: ContentOrigin): string {
  switch (origin.type) {
    case "ai_generated":
      return `AI-created with ${origin.confidence}% confidence of language logic`;
    case "human":
      return `Written by ${origin.author}`;
    case "source":
      return `Source: ${origin.citation}`;
  }
}

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
