/**
 * ElevenLabs adapter. API: POST /v1/text-to-speech/{voice_id}
 * https://elevenlabs.io/docs/api-reference/text-to-speech/convert
 *
 * Māori ("mi") is listed for eleven_v4, eleven_v4_turbo and eleven_v3
 * (checked 2026-11-17). Older models (multilingual_v2, flash_v2_5) do not list it.
 */

import type { LangCode } from "@/features/content/types";
import { TtsProviderError, type TextToSpeechModel } from "./types";

const API_BASE = "https://api.elevenlabs.io";
const OUTPUT_FORMAT = "mp3_44100_128";

type Options = {
  modelId: string;
  label: string;
  languages: readonly LangCode[];
  apiKey: string;
  voiceId: string;
  /** Injected in tests so no real network calls are made. */
  fetchImpl?: typeof fetch;
};

export function createElevenLabsModel(opts: Options): TextToSpeechModel {
  const doFetch = opts.fetchImpl ?? fetch;

  return {
    id: `elevenlabs:${opts.modelId}`,
    label: opts.label,
    providerName: "ElevenLabs",
    languages: opts.languages,
    cacheIdentity: `elevenlabs:${opts.modelId}:${opts.voiceId}:${OUTPUT_FORMAT}`,

    async synthesize({ text, lang }, signal) {
      const url = `${API_BASE}/v1/text-to-speech/${encodeURIComponent(opts.voiceId)}?output_format=${OUTPUT_FORMAT}`;
      const res = await doFetch(url, {
        method: "POST",
        headers: { "xi-api-key": opts.apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({ text, model_id: opts.modelId, language_code: lang }),
        signal,
      });
      if (!res.ok) {
        // Log details server-side only; never send provider errors to the browser.
        const detail = await res.text().catch(() => "");
        throw new TtsProviderError(`ElevenLabs ${res.status}: ${detail.slice(0, 300)}`, res.status);
      }
      return { audio: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? "audio/mpeg" };
    },
  };
}
