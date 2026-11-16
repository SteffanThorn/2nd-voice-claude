import { describe, expect, it } from "vitest";
import { CONTENT, TOPIC_CONTENT } from "./content";
import { buildContent, containsTerm, words } from "./content/build";
import { defineTopic } from "./content/define";
import { getConversationVocabulary, getConversationsForTopic, resolveLines } from "./repository";
import { TOPICS, getTopic } from "./topics";

describe("topics", () => {
  it("has unique, URL-safe slugs", () => {
    const slugs = TOPICS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("every topic has a pathway from beginner to intermediate", () => {
    for (const topic of TOPICS) {
      const convs = getConversationsForTopic(topic.slug);
      expect(convs.length, topic.slug).toBeGreaterThanOrEqual(3);
      expect(convs.map((c) => c.level), topic.slug).toEqual(convs.map((_, i) => i + 1));
      expect(convs[0].difficulty, topic.slug).toBe("beginner_1");
      expect(convs.at(-1)!.difficulty.startsWith("intermediate"), topic.slug).toBe(true);
    }
  });
});

describe("authored content", () => {
  it("every topic content block belongs to a real topic", () => {
    for (const t of TOPIC_CONTENT) expect(getTopic(t.topicSlug), t.topicSlug).toBeDefined();
  });

  it("slugs are unique and URL-safe within a topic", () => {
    for (const t of TOPIC_CONTENT) {
      const slugs = t.conversations.map((c) => c.slug);
      expect(new Set(slugs).size, t.topicSlug).toBe(slugs.length);
      for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("every vocabulary word actually appears in its conversation", () => {
    const missing: string[] = [];
    for (const t of TOPIC_CONTENT) {
      for (const c of t.conversations) {
        for (const [headword] of c.vocabulary) {
          if (!c.lines.some(([, text]) => containsTerm(text, headword))) missing.push(`${t.topicSlug}/${c.slug}: "${headword}"`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it("confidence scores are whole numbers from 0 to 100", () => {
    for (const t of TOPIC_CONTENT)
      for (const c of t.conversations)
        for (const [, text, , confidence] of c.lines) {
          expect(Number.isInteger(confidence) && confidence >= 0 && confidence <= 100, text).toBe(true);
        }
  });

  it("lines are not empty and have translations", () => {
    for (const t of TOPIC_CONTENT)
      for (const c of t.conversations) {
        expect(c.lines.length).toBeGreaterThanOrEqual(5);
        for (const [speaker, text, translation] of c.lines) {
          expect(speaker.trim() && text.trim() && translation.trim(), `${c.slug}: ${text}`).toBeTruthy();
        }
      }
  });

  it("the same headword keeps the same meaning across conversations (except true homonyms)", () => {
    const homonyms = new Set(["wai", "toa"]); // wai: who / water; toa: shop / win
    const meanings = new Map<string, Set<string>>();
    for (const v of CONTENT.vocabulary.values()) {
      const key = v.headword.toLowerCase();
      meanings.set(key, (meanings.get(key) ?? new Set()).add(v.translation));
    }
    const conflicts = [...meanings].filter(([h, m]) => m.size > 1 && !homonyms.has(h)).map(([h, m]) => `${h}: ${[...m].join(" | ")}`);
    expect(conflicts).toEqual([]);
  });
});

describe("built content", () => {
  it("every line resolves and vocabulary links exist", () => {
    for (const c of CONTENT.conversations) {
      expect(() => resolveLines(c)).not.toThrow();
      expect(() => getConversationVocabulary(c)).not.toThrow();
    }
  });

  it("AI-created content is never marked verified and always says so", () => {
    for (const s of CONTENT.sentences.values()) {
      expect(s.verificationStatus).not.toBe("verified");
      expect(s.origin.type).toBe("ai_generated");
    }
    for (const c of CONTENT.conversations) expect(c.verificationStatus).not.toBe("verified");
  });

  it("a sentence used twice is stored once", () => {
    const texts = [...CONTENT.sentences.values()].map((s) => s.text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it("refuses the same sentence with two different translations", () => {
    const line = (en: string) => ["A", "Kia ora", en, 90] as const;
    const conv = (slug: string, en: string) => ({
      slug, level: 1, difficulty: "beginner_1" as const, title: "", description: "",
      lines: [line(en)], vocabulary: [], notes: [],
    });
    expect(() => buildContent([defineTopic("x", [conv("a", "Hello"), conv("b", "Thanks")])])).toThrow(/two different translations/);
  });
});

describe("word matching", () => {
  it("keeps macrons meaningful and matches whole words only", () => {
    expect(words("Kei te pēhea koe?")).toEqual(["kei", "te", "pēhea", "koe"]);
    expect(containsTerm("Kei te pēhea koe?", "pēhea")).toBe(true);
    expect(containsTerm("Kei te pēhea koe?", "pehea")).toBe(false); // ē ≠ e
    expect(containsTerm("Ka kite anō.", "ka kite anō")).toBe(true);
    expect(containsTerm("Kei te mahi", "ahi")).toBe(false); // not a whole word
    expect(containsTerm("Kia ORA!", "kia ora")).toBe(true);
    expect(containsTerm("pēhea", "pēhea")).toBe(true); // decomposed macron
  });
});
