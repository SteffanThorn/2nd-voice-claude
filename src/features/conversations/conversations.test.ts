import { describe, expect, it } from "vitest";
import {
  getConversationVocabulary,
  getConversationsForTopic,
  resolveLines,
  sampleContentEnabled,
} from "./repository";
import { SAMPLE_CONVERSATIONS, SAMPLE_SENTENCES, SAMPLE_VOCABULARY } from "./sample-data";
import { TOPICS, getTopic } from "./topics";

describe("topics", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("conversation content integrity", () => {
  it("every conversation belongs to a real topic", () => {
    for (const c of SAMPLE_CONVERSATIONS) expect(getTopic(c.topicSlug), c.slug).toBeDefined();
  });

  it("slugs and levels are unique within a topic", () => {
    for (const topic of TOPICS) {
      const inTopic = SAMPLE_CONVERSATIONS.filter((c) => c.topicSlug === topic.slug);
      expect(new Set(inTopic.map((c) => c.slug)).size).toBe(inTopic.length);
      expect(new Set(inTopic.map((c) => c.level)).size).toBe(inTopic.length);
    }
  });

  it("every line resolves to a sentence and a speaker", () => {
    for (const c of SAMPLE_CONVERSATIONS) expect(() => resolveLines(c)).not.toThrow();
  });

  it("every vocabulary reference exists", () => {
    for (const c of SAMPLE_CONVERSATIONS) expect(() => getConversationVocabulary(c)).not.toThrow();
  });

  it("ids are unique", () => {
    expect(new Set(SAMPLE_SENTENCES.map((s) => s.id)).size).toBe(SAMPLE_SENTENCES.length);
    expect(new Set(SAMPLE_VOCABULARY.map((v) => v.id)).size).toBe(SAMPLE_VOCABULARY.length);
  });

  it("AI-written sample content is never marked verified", () => {
    for (const c of SAMPLE_CONVERSATIONS) expect(c.verificationStatus).not.toBe("verified");
    for (const s of SAMPLE_SENTENCES) expect(s.verificationStatus).not.toBe("verified");
    for (const v of SAMPLE_VOCABULARY) expect(v.verificationStatus).not.toBe("verified");
  });
});

describe("derived vocabulary", () => {
  it("is de-duplicated and in first-appearance order", () => {
    const vocab = getConversationVocabulary(SAMPLE_CONVERSATIONS[0]);
    const ids = vocab.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("sample-v-kia-ora");
  });
});

describe("sample content gating", () => {
  const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

  it("is shown in development and test", () => {
    expect(sampleContentEnabled(env({ NODE_ENV: "development" }))).toBe(true);
    expect(sampleContentEnabled(env({ NODE_ENV: "test" }))).toBe(true);
  });

  it("is hidden in production unless explicitly enabled", () => {
    expect(sampleContentEnabled(env({ NODE_ENV: "production" }))).toBe(false);
    expect(sampleContentEnabled(env({ NODE_ENV: "production", SHOW_SAMPLE_CONTENT: "true" }))).toBe(true);
  });

  it("returns conversations in level order", () => {
    const levels = getConversationsForTopic("meeting-people").map((c) => c.level);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });
});
