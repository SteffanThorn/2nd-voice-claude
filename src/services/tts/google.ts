/**
 * Google Cloud Text-to-Speech adapter: EXPERIMENTAL for Māori.
 *
 * Google has no Māori voice, so this reads Māori text with a voice from
 * another language (Spanish by default, which has similar vowels and a
 * tapped "r"). Expect errors on "wh", initial "ng" and vowel length.
 *
 * API: POST https://texttospeech.googleapis.com/v1/text:synthesize
 * Response: { audioContent: base64 }.
 */

import type { LangCode } from "@/features/content/types";
import { TtsProviderError, type TextToSpeechModel } from "./types";

const ENDPOINT = "https://texttospeech.googleapis.com/v1/text:synthesize";

const LANGUAGE_NAMES: Record<string, string> = {
  "es-ES": "Spanish",
  "es-US": "Spanish (US)",
  "it-IT": "Italian",
  "id-ID": "Indonesian",
  "en-AU": "Australian English",
  "en-GB": "British English",
};

type Options = {
  apiKey: string;
  /** The borrowed voice's language, e.g. "es-ES". */
  voiceLanguageCode: string;
  /** Optional exact voice name; if omitted, Google picks a default for the language. */
  voiceName?: string;
  /** Which of our languages this model is offered for. */
  languages: readonly LangCode[];
  fetchImpl?: typeof fetch;
};

export function createGoogleModel(opts: Options): TextToSpeechModel {
  const doFetch = opts.fetchImpl ?? fetch;
  const borrowed = LANGUAGE_NAMES[opts.voiceLanguageCode] ?? opts.voiceLanguageCode;

  return {
    id: `google:${opts.voiceLanguageCode}`,
    label: `Google Cloud · ${borrowed} voice`,
    providerName: "Google Cloud",
    languages: opts.languages,
    experimental: true,
    cacheIdentity: `google:${opts.voiceLanguageCode}:${opts.voiceName ?? "default"}:mp3`,

    async synthesize({ text }, signal) {
      const res = await doFetch(ENDPOINT, {
        method: "POST",
        headers: { "X-Goog-Api-Key": opts.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: opts.voiceLanguageCode, ...(opts.voiceName ? { name: opts.voiceName } : {}) },
          audioConfig: { audioEncoding: "MP3" },
        }),
        signal,
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new TtsProviderError(`Google TTS ${res.status}: ${detail.slice(0, 300)}`, res.status);
      }
      const data = (await res.json()) as { audioContent?: string };
      if (!data.audioContent) throw new TtsProviderError("Google TTS returned no audio");
      const bytes = Buffer.from(data.audioContent, "base64");
      return { audio: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer, contentType: "audio/mpeg" };
    },
  };
}
