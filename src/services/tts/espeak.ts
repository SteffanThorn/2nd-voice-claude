/**
 * eSpeak NG adapter: EXPERIMENTAL.
 *
 * eSpeak NG is a free, open-source synthesiser with its own Māori ("mi")
 * pronunciation rules. It is robotic, and its rules aren't perfect.
 * It runs inside the app as WebAssembly: no API key, no cost, no system install.
 *
 * Licence: GPL-3.0. We run it only on the server and don't ship it to
 * browsers. Check the licence obligations before a commercial launch;
 * removing it means deleting this adapter and its registry entry.
 */

import type { LangCode } from "@/features/content/types";
import { TtsProviderError, type TextToSpeechModel } from "./types";

type ESpeakFactory = typeof import("espeak-ng").default;

const ESPEAK_VOICES: Partial<Record<LangCode, string>> = { mi: "mi", es: "es", zh: "cmn", en: "en" };

export function createEspeakModel(opts: { loadFactory?: () => Promise<ESpeakFactory> } = {}): TextToSpeechModel {
  const load = opts.loadFactory ?? (async () => (await import("espeak-ng")).default);

  return {
    id: "espeak:mi",
    label: "eSpeak NG · Māori rules",
    providerName: "eSpeak NG",
    languages: ["mi"],
    experimental: true,
    cacheIdentity: "espeak-ng@1.0.2:default",

    async synthesize({ text, lang }) {
      const voice = ESPEAK_VOICES[lang];
      if (!voice) throw new TtsProviderError(`eSpeak NG has no voice configured for "${lang}"`);
      const ESpeakNg = await load();
      try {
        // The text goes in a file (-f) rather than on the command line, so it can
        // never be mistaken for an option, even if it starts with "-".
        const es = await ESpeakNg({
          arguments: ["-v", voice, "-b", "1", "-f", "in.txt", "-w", "out.wav"],
          preRun: [(m) => m.FS.writeFile("in.txt", text)],
          print: () => {},
          printErr: () => {},
        });
        const wav = es.FS.readFile("out.wav");
        if (wav.length < 100) throw new Error("empty output");
        return { audio: wav.slice().buffer as ArrayBuffer, contentType: "audio/wav" };
      } catch (err) {
        throw new TtsProviderError(`eSpeak NG failed: ${String(err)}`);
      }
    },
  };
}
