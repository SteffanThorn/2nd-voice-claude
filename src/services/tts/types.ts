/**
 * Text-to-speech provider interface.
 *
 * The app talks only to this interface, never to a vendor SDK directly.
 * Adding a provider (e.g. Papa Reo) means writing one adapter that
 * returns TextToSpeechModel objects and registering it in registry.ts.
 */

import type { LangCode } from "@/features/content/types";

export type SynthesisRequest = { text: string; lang: LangCode };
export type SynthesisResult = { audio: ArrayBuffer; contentType: string };

export interface TextToSpeechModel {
  /** Stable id used in URLs and saved preferences, e.g. "elevenlabs:eleven_v4". */
  id: string;
  /** Shown to learners, e.g. "ElevenLabs v4". */
  label: string;
  providerName: string;
  languages: readonly LangCode[];
  /** Everything that changes the sound (model + voice). Used as part of the cache key. */
  cacheIdentity: string;
  synthesize(request: SynthesisRequest, signal?: AbortSignal): Promise<SynthesisResult>;
}

/** The safe subset sent to the browser: no keys, no voice ids. */
export type TtsModelInfo = { id: string; label: string; providerName: string };

export class TtsProviderError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "TtsProviderError";
  }
}
