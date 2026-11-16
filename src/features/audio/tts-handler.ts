/**
 * Core logic behind GET /api/tts?sentence=<id>&model=<id>.
 *
 * Kept separate from the route file so it can be tested with fake
 * providers and a fake cache (no network, no cost).
 *
 * Security: the browser only sends ids, never free text. We only speak
 * sentences that exist in visible content, so our API key can't be used
 * as a general-purpose TTS service, and cost is bounded by
 * (number of sentences × number of models).
 */

import { z } from "zod";
import type { Sentence } from "@/features/content/types";
import { audioCacheKey, type AudioCache } from "@/services/audio-cache/audio-cache";
import type { TextToSpeechModel } from "@/services/tts/types";

const Query = z.object({
  sentence: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
});

export type TtsDeps = {
  findSentence: (id: string) => Sentence | undefined;
  models: TextToSpeechModel[];
  cache: AudioCache;
  log?: (msg: string) => void;
};

export async function handleTtsRequest(searchParams: URLSearchParams, deps: TtsDeps): Promise<Response> {
  const parsed = Query.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return text(400, "Invalid request");

  const sentence = deps.findSentence(parsed.data.sentence);
  if (!sentence) return text(404, "Sentence not found");

  const model = deps.models.find((m) => m.id === parsed.data.model && m.languages.includes(sentence.language));
  if (!model) return text(404, "Model not available");

  const key = audioCacheKey({ cacheIdentity: model.cacheIdentity, lang: sentence.language, text: sentence.text });

  let result = await deps.cache.get(key);
  let cacheStatus = "HIT";
  if (!result) {
    cacheStatus = "MISS";
    try {
      result = await model.synthesize({ text: sentence.text, lang: sentence.language });
    } catch (err) {
      (deps.log ?? console.error)(`TTS failed for ${model.id} / ${sentence.id}: ${String(err)}`);
      return text(502, "Audio could not be generated");
    }
    try {
      await deps.cache.set(key, result);
    } catch (err) {
      // Serving the audio matters more than caching it.
      (deps.log ?? console.error)(`Audio cache write failed: ${String(err)}`);
    }
  }

  return new Response(result.audio, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      // Browser may reuse it for a day; text edits produce new audio after that.
      "Cache-Control": "private, max-age=86400",
      "X-Audio-Cache": cacheStatus,
    },
  });
}

function text(status: number, body: string) {
  return new Response(body, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
