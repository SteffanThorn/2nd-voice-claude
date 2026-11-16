import type { Difficulty, Provenance, VerificationStatus } from "@/features/content/types";

export type Character = { id: string; name: string };

/** A line points at a sentence by id, so the sentence can be reused elsewhere. */
export type ConversationLine = { characterId: string; sentenceId: string };

export type Conversation = {
  slug: string;
  topicSlug: string;
  /** Position in the topic's pathway: level 1 comes before level 2. */
  level: number;
  title: string;
  description: string;
  difficulty: Difficulty;
  characters: Character[];
  lines: ConversationLine[];
  learningNotes: string[];
  provenance: Provenance[];
  verificationStatus: VerificationStatus;
};
