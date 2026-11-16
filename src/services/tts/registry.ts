/**
 * Which TTS models are available, based on which providers have keys set.
 * A model only appears to learners if it is actually configured, so there
 * are never buttons for audio that can't play.
 */

import "server-only"; // build fails if this file is ever imported into browser code

import type { LangCode } from "@/features/content/types";
import { createElevenLabsModel } from "./elevenlabs";
import { createEspeakModel } from "./espeak";
import { createGoogleModel } from "./google";
import type { TextToSpeechModel, TtsModelInfo } from "./types";

export function getTtsModels(env: NodeJS.ProcessEnv = process.env): TextToSpeechModel[] {
  const models: TextToSpeechModel[] = [];

  const elevenKey = env.ELEVENLABS_API_KEY?.trim();
  const elevenVoice = env.ELEVENLABS_VOICE_ID?.trim();
  if (elevenKey && elevenVoice) {
    const shared = { apiKey: elevenKey, voiceId: elevenVoice, languages: ["mi", "zh", "es", "en"] as const };
    models.push(
      createElevenLabsModel({ ...shared, modelId: "eleven_v4", label: "ElevenLabs v4" }),
      createElevenLabsModel({ ...shared, modelId: "eleven_v3", label: "ElevenLabs v3" }),
    );
  }

  // Experimental (listed after the main voices so they're never the default).
  const googleKey = env.GOOGLE_TTS_API_KEY?.trim();
  if (googleKey) {
    models.push(
      createGoogleModel({
        apiKey: googleKey,
        voiceLanguageCode: env.GOOGLE_TTS_LANGUAGE_CODE?.trim() || "es-ES",
        voiceName: env.GOOGLE_TTS_VOICE_NAME?.trim() || undefined,
        languages: ["mi"],
      }),
    );
  }
  if (env.ESPEAK_NG_ENABLED?.trim() === "true") {
    models.push(createEspeakModel());
  }

  // Future: Papa Reo (Te Hiku Media) once API access is granted.

  return models;
}

export function getTtsModelsFor(lang: LangCode, env: NodeJS.ProcessEnv = process.env): TextToSpeechModel[] {
  return getTtsModels(env).filter((m) => m.languages.includes(lang));
}

export function toPublicInfo(m: TextToSpeechModel): TtsModelInfo {
  return { id: m.id, label: m.label, providerName: m.providerName, experimental: m.experimental ?? false };
}
