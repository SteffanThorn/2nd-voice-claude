import { describe, expect, it, vi } from "vitest";
import type { Sentence } from "@/features/content/types";
import type { AudioCache } from "@/services/audio-cache/audio-cache";
import type { SynthesisResult, TextToSpeechModel } from "@/services/tts/types";
import { handleTtsRequest, type TtsDeps } from "./tts-handler";

const sentence: Sentence = {
  id: "s1",
  language: "mi",
  text: "Kia ora",
  translation: "Hello",
  vocabularyIds: [],
  verificationStatus: "unverified",
  origin: { type: "ai_generated", model: "test", confidence: 90 },
};

function memoryCache(): AudioCache & { store: Map<string, SynthesisResult> } {
  const store = new Map<string, SynthesisResult>();
  return { store, get: async (k) => store.get(k) ?? null, set: async (k, v) => void store.set(k, v) };
}

function fakeModel(overrides: Partial<TextToSpeechModel> = {}): TextToSpeechModel {
  return {
    id: "fake:m1",
    label: "Fake",
    providerName: "Fake",
    languages: ["mi"],
    cacheIdentity: "fake:m1:voice",
    synthesize: vi.fn(async () => ({ audio: new Uint8Array([1, 2]).buffer, contentType: "audio/mpeg" })),
    ...overrides,
  };
}

function deps(overrides: Partial<TtsDeps> = {}): TtsDeps {
  return {
    findSentence: (id) => (id === "s1" ? sentence : undefined),
    models: [fakeModel()],
    cache: memoryCache(),
    log: () => {},
    ...overrides,
  };
}

const q = (params: Record<string, string>) => new URLSearchParams(params);

describe("GET /api/tts handler", () => {
  it("400 for missing or oversized params", async () => {
    expect((await handleTtsRequest(q({}), deps())).status).toBe(400);
    expect((await handleTtsRequest(q({ sentence: "s1", model: "x".repeat(101) }), deps())).status).toBe(400);
  });

  it("404 for unknown or hidden sentences (no free-text synthesis)", async () => {
    const res = await handleTtsRequest(q({ sentence: "anything else", model: "fake:m1" }), deps());
    expect(res.status).toBe(404);
  });

  it("404 for a model that isn't configured or doesn't support the language", async () => {
    expect((await handleTtsRequest(q({ sentence: "s1", model: "nope" }), deps())).status).toBe(404);
    const spanishOnly = fakeModel({ languages: ["es"] });
    expect((await handleTtsRequest(q({ sentence: "s1", model: "fake:m1" }), deps({ models: [spanishOnly] }))).status).toBe(404);
  });

  it("synthesises once, then serves from cache", async () => {
    const model = fakeModel();
    const d = deps({ models: [model] });

    const first = await handleTtsRequest(q({ sentence: "s1", model: "fake:m1" }), d);
    expect(first.status).toBe(200);
    expect(first.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(first.headers.get("X-Audio-Cache")).toBe("MISS");

    const second = await handleTtsRequest(q({ sentence: "s1", model: "fake:m1" }), d);
    expect(second.headers.get("X-Audio-Cache")).toBe("HIT");
    expect(new Uint8Array(await second.arrayBuffer())).toEqual(new Uint8Array([1, 2]));
    expect(model.synthesize).toHaveBeenCalledTimes(1);
  });

  it("502 with a generic message when the provider fails", async () => {
    const failing = fakeModel({ synthesize: vi.fn(async () => Promise.reject(new Error("secret provider detail"))) });
    const res = await handleTtsRequest(q({ sentence: "s1", model: "fake:m1" }), deps({ models: [failing] }));
    expect(res.status).toBe(502);
    expect(await res.text()).not.toContain("secret");
  });

  it("still serves audio if the cache write fails", async () => {
    const brokenCache: AudioCache = { get: async () => null, set: async () => Promise.reject(new Error("disk full")) };
    const res = await handleTtsRequest(q({ sentence: "s1", model: "fake:m1" }), deps({ cache: brokenCache }));
    expect(res.status).toBe(200);
  });
});
