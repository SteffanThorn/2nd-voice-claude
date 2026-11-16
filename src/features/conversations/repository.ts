/**
 * Data-access layer for conversations.
 *
 * Pages call these functions and never touch the raw data directly. When the
 * database arrives, only this file changes: the pages stay the same.
 */

import type { Sentence, VocabularyItem } from "@/features/content/types";
import { CONTENT } from "./content";
import type { Character, Conversation } from "./types";

const { conversations, sentences, vocabulary } = CONTENT;

/** Conversations in a topic, in pathway order (level 1 first). */
export function getConversationsForTopic(topicSlug: string): Conversation[] {
  return conversations.filter((c) => c.topicSlug === topicSlug).sort((a, b) => a.level - b.level);
}

export function getConversation(topicSlug: string, slug: string): Conversation | undefined {
  return conversations.find((c) => c.topicSlug === topicSlug && c.slug === slug);
}

/** A sentence by id. Used by the audio endpoint, which only speaks known sentences. */
export function getSentence(id: string): Sentence | undefined {
  return sentences.get(id);
}

export function getAllConversationParams(): { topic: string; conversation: string }[] {
  return conversations.map((c) => ({ topic: c.topicSlug, conversation: c.slug }));
}

/** A line with its sentence and speaker resolved: what the screen needs. */
export type ResolvedLine = { character: Character; sentence: Sentence };

export function resolveLines(conversation: Conversation): ResolvedLine[] {
  return conversation.lines.map((line) => {
    const sentence = sentences.get(line.sentenceId);
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
      const item = vocabulary.get(id);
      if (!item) throw new Error(`Sentence "${sentence.id}" references missing vocabulary "${id}"`);
      if (!seen.has(id)) {
        seen.add(id);
        result.push(item);
      }
    }
  }
  return result;
}
