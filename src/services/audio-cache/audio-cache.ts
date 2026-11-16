/**
 * Stores generated audio so each sentence/model/voice is only paid for once.
 *
 * FileSystemAudioCache writes to ./.cache/tts (git-ignored). That works for
 * local development but NOT on Vercel, where the disk is temporary.
 * Production will use a Supabase Storage implementation of this interface.
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SynthesisResult } from "@/services/tts/types";

export interface AudioCache {
  get(key: string): Promise<SynthesisResult | null>;
  set(key: string, value: SynthesisResult): Promise<void>;
}

/** Same inputs → same key. Any change to text, language, model or voice → new key. */
export function audioCacheKey(parts: { cacheIdentity: string; lang: string; text: string }): string {
  return createHash("sha256")
    .update(JSON.stringify([parts.cacheIdentity, parts.lang, parts.text.normalize("NFC")]))
    .digest("hex");
}

export class FileSystemAudioCache implements AudioCache {
  constructor(private readonly dir: string = path.join(process.cwd(), ".cache", "tts")) {}

  private file(key: string, ext: string) {
    if (!/^[a-f0-9]{64}$/.test(key)) throw new Error("Invalid cache key"); // no path tricks
    // turbopackIgnore: these files are written at runtime, not shipped with the build.
    return path.join(/*turbopackIgnore: true*/ this.dir, `${key}.${ext}`);
  }

  async get(key: string): Promise<SynthesisResult | null> {
    try {
      const [audio, contentType] = await Promise.all([
        readFile(this.file(key, "audio")),
        readFile(this.file(key, "type"), "utf8"),
      ]);
      return { audio: audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer, contentType };
    } catch {
      return null;
    }
  }

  async set(key: string, value: SynthesisResult): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.file(key, "audio"), Buffer.from(value.audio));
    await writeFile(this.file(key, "type"), value.contentType);
  }
}
