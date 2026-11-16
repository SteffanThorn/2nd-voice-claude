import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { FileSystemAudioCache, audioCacheKey } from "@/services/audio-cache/audio-cache";
import { createElevenLabsModel } from "./elevenlabs";
import { getTtsModels, getTtsModelsFor, toPublicInfo } from "./registry";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("ElevenLabs adapter", () => {
  function setup(response: Response) {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);
    const model = createElevenLabsModel({
      modelId: "eleven_v4",
      label: "ElevenLabs v4",
      languages: ["mi"],
      apiKey: "test-key",
      voiceId: "voice/123",
      fetchImpl,
    });
    return { model, fetchImpl };
  }

  it("sends the right request", async () => {
    const { model, fetchImpl } = setup(new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "audio/mpeg" } }));
    const result = await model.synthesize({ text: "Kia ora", lang: "mi" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.elevenlabs.io/v1/text-to-speech/voice%2F123?output_format=mp3_44100_128");
    expect(init?.method).toBe("POST");
    expect((init?.headers as Record<string, string>)["xi-api-key"]).toBe("test-key");
    expect(JSON.parse(init?.body as string)).toEqual({ text: "Kia ora", model_id: "eleven_v4", language_code: "mi" });
    expect(result.contentType).toBe("audio/mpeg");
    expect(new Uint8Array(result.audio)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it("throws a provider error on failure", async () => {
    const { model } = setup(new Response("quota exceeded", { status: 401 }));
    await expect(model.synthesize({ text: "Kia ora", lang: "mi" })).rejects.toThrow(/ElevenLabs 401/);
  });

  it("cache identity changes with the voice", () => {
    const a = createElevenLabsModel({ modelId: "eleven_v4", label: "", languages: ["mi"], apiKey: "k", voiceId: "A" });
    const b = createElevenLabsModel({ modelId: "eleven_v4", label: "", languages: ["mi"], apiKey: "k", voiceId: "B" });
    expect(a.cacheIdentity).not.toBe(b.cacheIdentity);
  });
});

describe("TTS registry", () => {
  it("offers no models without keys", () => {
    expect(getTtsModels(env({}))).toEqual([]);
    expect(getTtsModels(env({ ELEVENLABS_API_KEY: "k" }))).toEqual([]); // voice missing
  });

  it("offers ElevenLabs v4 and v3 for Māori when configured", () => {
    const models = getTtsModelsFor("mi", env({ ELEVENLABS_API_KEY: "k", ELEVENLABS_VOICE_ID: "v" }));
    expect(models.map((m) => m.id)).toEqual(["elevenlabs:eleven_v4", "elevenlabs:eleven_v3"]);
  });

  it("never exposes keys or voice ids to the browser", () => {
    const [m] = getTtsModels(env({ ELEVENLABS_API_KEY: "secret-key", ELEVENLABS_VOICE_ID: "secret-voice" }));
    const json = JSON.stringify(toPublicInfo(m));
    expect(json).not.toContain("secret-key");
    expect(json).not.toContain("secret-voice");
  });
});

describe("audio cache", () => {
  let dir: string | undefined;
  afterAll(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it("keys are stable and sensitive to every input", () => {
    const base = { cacheIdentity: "m:v", lang: "mi", text: "Kia ora" };
    expect(audioCacheKey(base)).toBe(audioCacheKey({ ...base }));
    expect(audioCacheKey(base)).not.toBe(audioCacheKey({ ...base, text: "Kia ora!" }));
    expect(audioCacheKey(base)).not.toBe(audioCacheKey({ ...base, cacheIdentity: "m:w" }));
    // Same text typed with a composed vs decomposed macron → same key.
    expect(audioCacheKey({ ...base, text: "pēhea" })).toBe(audioCacheKey({ ...base, text: "pēhea" }));
  });

  it("round-trips audio through the filesystem", async () => {
    dir = await mkdtemp(path.join(tmpdir(), "2v-cache-"));
    const cache = new FileSystemAudioCache(dir);
    const key = audioCacheKey({ cacheIdentity: "m", lang: "mi", text: "x" });
    expect(await cache.get(key)).toBeNull();
    await cache.set(key, { audio: new Uint8Array([9, 8, 7]).buffer, contentType: "audio/mpeg" });
    const got = await cache.get(key);
    expect(got?.contentType).toBe("audio/mpeg");
    expect(new Uint8Array(got!.audio)).toEqual(new Uint8Array([9, 8, 7]));
  });

  it("rejects keys that could escape the cache folder", async () => {
    const cache = new FileSystemAudioCache("/tmp/never-used");
    await expect(cache.set("../../etc/passwd", { audio: new ArrayBuffer(1), contentType: "x" })).rejects.toThrow();
  });
});
