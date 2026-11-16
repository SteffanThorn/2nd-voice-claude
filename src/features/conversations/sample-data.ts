/**
 * ⚠️ SAMPLE CONTENT: NOT VERIFIED.
 *
 * Written by Claude (AI) only so the conversation screen can be built and
 * tested. It uses very common introductory phrases, but no human reviewer
 * has checked it. It is hidden in production builds (see repository.ts)
 * and must be replaced by human-written or human-verified content.
 */

import type { Sentence, VocabularyItem } from "@/features/content/types";
import type { Conversation } from "./types";

export const SAMPLE_VOCABULARY: VocabularyItem[] = [
  { id: "sample-v-kia-ora", headword: "kia ora", translation: "hello; thank you", verificationStatus: "unverified" },
  { id: "sample-v-pehea", headword: "pēhea", translation: "how", verificationStatus: "unverified" },
  { id: "sample-v-pai", headword: "pai", translation: "good", verificationStatus: "unverified" },
  { id: "sample-v-ahau", headword: "ahau", translation: "I, me", verificationStatus: "unverified" },
  { id: "sample-v-koe", headword: "koe", translation: "you (one person)", verificationStatus: "unverified" },
  { id: "sample-v-ingoa", headword: "ingoa", translation: "name", verificationStatus: "unverified" },
  { id: "sample-v-wai", headword: "wai", translation: "who", verificationStatus: "unverified" },
  { id: "sample-v-hea", headword: "hea", translation: "where", verificationStatus: "unverified" },
  { id: "sample-v-ka-kite", headword: "ka kite anō", translation: "see you again", verificationStatus: "unverified" },
];

export const SAMPLE_SENTENCES: Sentence[] = [
  { id: "sample-s-1", language: "mi", text: "Kia ora!", translation: "Hello!", vocabularyIds: ["sample-v-kia-ora"], verificationStatus: "unverified" },
  { id: "sample-s-2", language: "mi", text: "Kia ora. Kei te pēhea koe?", translation: "Hello. How are you?", vocabularyIds: ["sample-v-kia-ora", "sample-v-pehea", "sample-v-koe"], verificationStatus: "unverified" },
  { id: "sample-s-3", language: "mi", text: "Kei te pai ahau. Ko wai tōu ingoa?", translation: "I'm good. What is your name?", vocabularyIds: ["sample-v-pai", "sample-v-ahau", "sample-v-wai", "sample-v-ingoa"], verificationStatus: "unverified" },
  { id: "sample-s-4", language: "mi", text: "Ko Tama tōku ingoa. Ko wai tōu ingoa?", translation: "My name is Tama. What is your name?", vocabularyIds: ["sample-v-ingoa", "sample-v-wai"], verificationStatus: "unverified" },
  { id: "sample-s-5", language: "mi", text: "Ko Aroha tōku ingoa. Nō hea koe?", translation: "My name is Aroha. Where are you from?", vocabularyIds: ["sample-v-ingoa", "sample-v-hea", "sample-v-koe"], verificationStatus: "unverified" },
  { id: "sample-s-6", language: "mi", text: "Nō Ahuriri ahau.", translation: "I'm from Napier.", vocabularyIds: ["sample-v-ahau"], verificationStatus: "unverified" },
  { id: "sample-s-7", language: "mi", text: "Ka pai! Ka kite anō.", translation: "Great! See you again.", vocabularyIds: ["sample-v-pai", "sample-v-ka-kite"], verificationStatus: "unverified" },
];

export const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    slug: "first-introductions",
    topicSlug: "meeting-people",
    level: 1,
    title: "First introductions",
    description: "Two people meet for the first time and introduce themselves.",
    difficulty: "beginner_1",
    characters: [
      { id: "aroha", name: "Aroha" },
      { id: "tama", name: "Tama" },
    ],
    lines: [
      { characterId: "aroha", sentenceId: "sample-s-1" },
      { characterId: "tama", sentenceId: "sample-s-2" },
      { characterId: "aroha", sentenceId: "sample-s-3" },
      { characterId: "tama", sentenceId: "sample-s-4" },
      { characterId: "aroha", sentenceId: "sample-s-5" },
      { characterId: "tama", sentenceId: "sample-s-6" },
      { characterId: "aroha", sentenceId: "sample-s-7" },
    ],
    learningNotes: [
      "“Kei te pēhea koe?” asks how someone is. A common reply is “Kei te pai ahau” (I'm good).",
      "“Ko … tōku ingoa” introduces your name. “Ko wai tōu ingoa?” asks someone theirs.",
      "“Nō hea koe?” asks where someone is from. Answer with “Nō … ahau”.",
    ],
    provenance: [{ description: "Sample written by Claude (AI) for UI development. Not from a verified source." }],
    verificationStatus: "unverified",
    isSample: true,
  },
];
