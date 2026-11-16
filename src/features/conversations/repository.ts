/**
 * Data-access layer for conversations.
 *
 * Pages call these functions and never touch the raw data directly. When the
 * database arrives, only this file changes: the pages stay the same.
 */

import type { Sentence, VocabularyItem } from "@/features/content/types";
import { SAMPLE_CONVERSATIONS, SAMPLE_SENTENCES, SAMPLE_VOCABULARY } from "./sample-data";
import type { Character, Conversation } from "./types";

/**
 * Sample (unverified) content is shown during development only, unless
 * SHOW_SAMPLE_CONTENT=true is set deliberately. This env var has no
 * NEXT_PUBLIC_ prefix, so it is read on the server only.
 */
export function sampleContentEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV !== "production" || env.SHOW_SAMPLE_CONTENT === "true";
}

function allConversations(): Conversation[] {
  return sampleContentEnabled() ? SAMPLE_CONVERSATIONS : [];
}

const sentencesById = new Map<string, Sentence>(SAMPLE_SENTENCES.map((s) => [s.id, s]));
const vocabularyById = new Map<string, VocabularyItem>(SAMPLE_VOCABULARY.map((v) => [v.id, v]));

/** Conversations in a topic, in pathway order (level 1 first). */
export function getConversationsForTopic(topicSlug: string): Conversation[] {
  return allConversations()
    .filter((c) => c.topicSlug === topicSlug)
    .sort((a, b) => a.level - b.level);
}

export function getConversation(topicSlug: string, slug: string): Conversation | undefined {
  return allConversations().find((c) => c.topicSlug === topicSlug && c.slug === slug);
}

/**
 * A sentence, but only if it appears in a conversation the current
 * environment shows. This is what stops the audio endpoint from
 * speaking hidden (e.g. sample-in-production) content.
 */
export function getVisibleSentence(id: string): Sentence | undefined {
  const visible = allConversations().some((c) => c.lines.some((l) => l.sentenceId === id));
  return visible ? sentencesById.get(id) : undefined;
}

export function getAllConversationParams(): { topic: string; conversation: string }[] {
  return allConversations().map((c) => ({ topic: c.topicSlug, conversation: c.slug }));
}

/** A line with its sentence and speaker resolved: what the screen needs. */
export type ResolvedLine = { character: Character; sentence: Sentence };

export function resolveLines(conversation: Conversation): ResolvedLine[] {
  return conversation.lines.map((line) => {
    const sentence = sentencesById.get(line.sentenceId);
    const character = conversation.characters.find((c) => c.id === line.characterId);
    if (!sentence || !character) {
      throw new Error(`Conversation "${conversation.slug}" has a broken line: ${JSON.stringify(line)}`);
    }
    return { character, sentence };
  });
}

/**
 * Vocabulary for a conversation, derived from its sentences (not stored
 * separately), de-duplicated, and in first-appearance order.
 */
export function getConversationVocabulary(conversation: Conversation): VocabularyItem[] {
  const seen = new Set<string>();
  const result: VocabularyItem[] = [];
  for (const { sentence } of resolveLines(conversation)) {
    for (const id of sentence.vocabularyIds) {
      const item = vocabularyById.get(id);
      if (!item) throw new Error(`Sentence "${sentence.id}" references missing vocabulary "${id}"`);
      if (!seen.has(id)) {
        seen.add(id);
        result.push(item);
      }
    }
  }
  return result;
}
