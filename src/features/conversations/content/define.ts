/**
 * Compact authoring format for conversations.
 *
 * Writers describe a conversation as speaker + Māori + English + confidence
 * lines and a short vocabulary list. build.ts turns this into the normalised
 * records (sentences, vocabulary, conversations) the app uses, the same
 * shape the database will have.
 */

import type { Difficulty } from "@/features/content/types";

/** The AI model that wrote the current conversations. */
export const AI_AUTHOR_MODEL = "Claude Opus 5.5";

/** [speaker, Māori text, English translation, AI confidence 0–100] */
export type LineInput = readonly [speaker: string, text: string, translation: string, confidence: number];

/** [headword, translation]. The headword must appear in at least one line. */
export type VocabInput = readonly [headword: string, translation: string];

export type ConversationInput = {
  slug: string;
  level: number;
  difficulty: Difficulty;
  title: string;
  description: string;
  lines: readonly LineInput[];
  vocabulary: readonly VocabInput[];
  notes: readonly string[];
};

export type TopicContent = { topicSlug: string; conversations: readonly ConversationInput[] };

export function defineTopic(topicSlug: string, conversations: ConversationInput[]): TopicContent {
  return { topicSlug, conversations };
}
