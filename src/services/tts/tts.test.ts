import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it, vi } from "vitest";
import { FileSystemAudioCache, audioCacheKey } from "@/services/audio-cache/audio-cache";
import { createElevenLabsModel } from "./elevenlabs";
import { createEspeakModel } from "./espeak";
import { createGoogleModel } from "./google";
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

describe("Google Cloud adapter (experimental)", () => {
  it("sends the right request and decodes base64 audio", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json({ audioContent: Buffer.from([4, 5, 6]).toString("base64") }),
    );
    const model = createGoogleModel({ apiKey: "g-key", voiceLanguageCode: "es-ES", languages: ["mi"], fetchImpl });
    const result = await model.synthesize({ text: "Kia ora", lang: "mi" });

    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://texttospeech.googleapis.com/v1/text:synthesize");
    expect((init?.headers as Record<string, string>)["X-Goog-Api-Key"]).toBe("g-key");
    expect(JSON.parse(init?.body as string)).toEqual({
      input: { text: "Kia ora" },
      voice: { languageCode: "es-ES" },
      audioConfig: { audioEncoding: "MP3" },
    });
    expect(new Uint8Array(result.audio)).toEqual(new Uint8Array([4, 5, 6]));
    expect(model.label).toBe("Google Cloud · Spanish voice");
    expect(model.experimental).toBe(true);
  });

  it("throws on API errors and on missing audio", async () => {
    const failing = createGoogleModel({
      apiKey: "k", voiceLanguageCode: "es-ES", languages: ["mi"],
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response("denied", { status: 403 })),
    });
    await expect(failing.synthesize({ text: "x", lang: "mi" })).rejects.toThrow(/Google TTS 403/);
    const empty = createGoogleModel({
      apiKey: "k", voiceLanguageCode: "es-ES", languages: ["mi"],
      fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(Response.json({})),
    });
    await expect(empty.synthesize({ text: "x", lang: "mi" })).rejects.toThrow(/no audio/);
  });
});

describe("eSpeak NG adapter (experimental, runs for real)", () => {
  const wavHeader = (buf: ArrayBuffer) => {
    const b = Buffer.from(buf);
    return `${b.subarray(0, 4).toString()}/${b.subarray(8, 12).toString()}`;
  };

  it("generates a real WAV file from Māori text with macrons", async () => {
    const result = await createEspeakModel().synthesize({ text: "Kei te pēhea koe? Nō Ahuriri ahau.", lang: "mi" });
    expect(result.contentType).toBe("audio/wav");
    expect(wavHeader(result.audio)).toBe("RIFF/WAVE");
    expect(result.audio.byteLength).toBeGreaterThan(10_000);
  });

  it("treats text starting with '-' as text, not as a command-line option", async () => {
    const result = await createEspeakModel().synthesize({ text: "--help kia ora", lang: "mi" });
    expect(wavHeader(result.audio)).toBe("RIFF/WAVE");
  });

  it("is deterministic, so caching is safe", async () => {
    const m = createEspeakModel();
    const a = Buffer.from((await m.synthesize({ text: "Kia ora", lang: "mi" })).audio);
    const b = Buffer.from((await m.synthesize({ text: "Kia ora", lang: "mi" })).audio);
    expect(a.equals(b)).toBe(true);
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

  it("adds experimental voices only when configured, after the main ones", () => {
    const ids = getTtsModelsFor(
      "mi",
      env({ ELEVENLABS_API_KEY: "k", ELEVENLABS_VOICE_ID: "v", GOOGLE_TTS_API_KEY: "g", ESPEAK_NG_ENABLED: "true" }),
    ).map((m) => m.id);
    expect(ids).toEqual(["elevenlabs:eleven_v4", "elevenlabs:eleven_v3", "google:es-ES", "espeak:mi"]);
    expect(getTtsModels(env({ ESPEAK_NG_ENABLED: "false" }))).toEqual([]);
    expect(getTtsModels(env({ GOOGLE_TTS_API_KEY: "g", GOOGLE_TTS_LANGUAGE_CODE: "it-IT" }))[0].label).toBe(
      "Google Cloud · Italian voice",
    );
  });

  it("never exposes keys or voice ids to the browser", () => {
    const models = getTtsModels(
      env({ ELEVENLABS_API_KEY: "secret-key", ELEVENLABS_VOICE_ID: "secret-voice", GOOGLE_TTS_API_KEY: "secret-google" }),
    );
    const json = JSON.stringify(models.map(toPublicInfo));
    expect(json).not.toContain("secret-key");
    expect(json).not.toContain("secret-voice");
    expect(json).not.toContain("secret-google");
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
