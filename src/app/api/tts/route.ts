// Route Handler: server code reachable at /api/tts. It wires the real
// dependencies into handleTtsRequest. API keys are read here, on the server.

import type { NextRequest } from "next/server";
import { handleTtsRequest } from "@/features/audio/tts-handler";
import { getVisibleSentence } from "@/features/conversations/repository";
import { FileSystemAudioCache } from "@/services/audio-cache/audio-cache";
import { getTtsModels } from "@/services/tts/registry";

const cache = new FileSystemAudioCache();

export async function GET(request: NextRequest) {
  return handleTtsRequest(request.nextUrl.searchParams, {
    findSentence: getVisibleSentence,
    models: getTtsModels(),
    cache,
  });
}
