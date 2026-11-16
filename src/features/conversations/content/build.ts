/**
 * Turns authored topic content into normalised records:
 * - each distinct Māori sentence is stored once (reused if it appears twice)
 * - each vocabulary item (headword + meaning) is stored once
 * - sentences are linked to the vocabulary they contain, automatically
 */

import type { Sentence, VocabularyItem } from "@/features/content/types";
import type { Character, Conversation } from "../types";
import { AI_AUTHOR_MODEL, type TopicContent } from "./define";

export type BuiltContent = {
  conversations: Conversation[];
  sentences: Map<string, Sentence>;
  vocabulary: Map<string, VocabularyItem>;
};

/** Lower-cased words, with macrons kept (ā ≠ a in te reo Māori). */
export function words(text: string): string[] {
  return text.normalize("NFC").toLowerCase().match(/[\p{L}\p{M}]+/gu) ?? [];
}

/** True if `term` (one or more words) appears as whole words in `text`. */
export function containsTerm(text: string, term: string): boolean {
  const t = words(text);
  const q = words(term);
  if (q.length === 0) return false;
  for (let i = 0; i + q.length <= t.length; i++) {
    if (q.every((w, j) => t[i + j] === w)) return true;
  }
  return false;
}

/** URL-safe id fragment: "Tāmaki Makaurau" → "tamaki-makaurau". */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function vocabularyId(headword: string, translation: string): string {
  return `v.${slugify(headword)}.${slugify(translation)}`;
}

export function buildContent(topics: readonly TopicContent[]): BuiltContent {
  const sentences = new Map<string, Sentence>();
  const sentenceIdByText = new Map<string, string>();
  const vocabulary = new Map<string, VocabularyItem>();
  const conversations: Conversation[] = [];

  for (const topic of topics) {
    for (const c of topic.conversations) {
      const vocabIds = c.vocabulary.map(([headword, translation]) => {
        const id = vocabularyId(headword, translation);
        if (!vocabulary.has(id)) {
          vocabulary.set(id, { id, headword, translation, verificationStatus: "unverified" });
        }
        return id;
      });

      const characters: Character[] = [];
      const lines = c.lines.map(([speaker, rawText, translation, confidence], i) => {
        const characterId = slugify(speaker);
        if (!characters.some((ch) => ch.id === characterId)) characters.push({ id: characterId, name: speaker });

        const text = rawText.normalize("NFC").trim();
        const linkedVocab = vocabIds.filter((id) => containsTerm(text, vocabulary.get(id)!.headword));

        const existingId = sentenceIdByText.get(text);
        if (existingId) {
          const existing = sentences.get(existingId)!;
          if (existing.translation !== translation) {
            throw new Error(
              `Sentence "${text}" has two different translations: "${existing.translation}" vs "${translation}"`,
            );
          }
          existing.vocabularyIds = [...new Set([...existing.vocabularyIds, ...linkedVocab])];
          return { characterId, sentenceId: existingId };
        }

        const id = `${topic.topicSlug}.${c.slug}.${i + 1}`;
        sentenceIdByText.set(text, id);
        sentences.set(id, {
          id,
          language: "mi",
          text,
          translation,
          vocabularyIds: linkedVocab,
          verificationStatus: "unverified",
          origin: { type: "ai_generated", model: AI_AUTHOR_MODEL, confidence },
        });
        return { characterId, sentenceId: id };
      });

      conversations.push({
        slug: c.slug,
        topicSlug: topic.topicSlug,
        level: c.level,
        title: c.title,
        description: c.description,
        difficulty: c.difficulty,
        characters,
        lines,
        learningNotes: [...c.notes],
        provenance: [
          { description: `Created by AI (${AI_AUTHOR_MODEL}). Not yet reviewed by a Māori language expert.` },
        ],
        verificationStatus: "unverified",
      });
    }
  }

  return { conversations, sentences, vocabulary };
}
