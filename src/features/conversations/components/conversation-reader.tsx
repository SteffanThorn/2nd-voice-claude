"use client";

/**
 * The interactive dialogue view. It's a Client Component because it holds
 * *state* (visible translations, what's playing, chosen model, speed) that
 * changes as you click.
 */

import { useEffect, useRef, useState } from "react";
import { originLabel, type ContentOrigin } from "@/features/content/types";
import type { TtsModelInfo } from "@/services/tts/types";
import type { ResolvedLine } from "../repository";

const SPEEDS = [0.5, 0.75, 1, 1.25] as const;
const MODEL_PREF_KEY = "2ndvoice.ttsModel";

type Playing = { index: number; continuous: boolean } | null;

export function ConversationReader({ lines, ttsModels }: { lines: ResolvedLine[]; ttsModels: TtsModelInfo[] }) {
  // --- Translations -------------------------------------------------------
  // useState is a React *hook*: it stores a value between renders and gives
  // us a setter. Calling the setter re-renders the component.
  const [showAll, setShowAll] = useState(false);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());

  function toggleAll() {
    setShowAll((v) => !v);
    setRevealed(new Set());
  }

  function toggleLine(index: number) {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  // --- Audio --------------------------------------------------------------
  // useRef holds the <audio> element itself; changing it doesn't re-render.
  const audioRef = useRef<HTMLAudioElement>(null);
  const [modelId, setModelId] = useState(ttsModels[0]?.id ?? "");
  const [speed, setSpeed] = useState<number>(1);
  const [playing, setPlaying] = useState<Playing>(null);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioEnabled = ttsModels.length > 0;
  const currentModel = ttsModels.find((m) => m.id === modelId);

  // useEffect runs after the component appears in the browser. We restore
  // the learner's preferred model here (localStorage only exists in the browser).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(MODEL_PREF_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from browser storage after hydration
      if (saved && ttsModels.some((m) => m.id === saved)) setModelId(saved);
    } catch {
      // Storage blocked (private mode etc.): just use the default model.
    }
  }, [ttsModels]);

  function chooseModel(id: string) {
    stop();
    setModelId(id);
    try {
      localStorage.setItem(MODEL_PREF_KEY, id);
    } catch {}
  }

  function play(index: number, continuous: boolean) {
    const audio = audioRef.current;
    if (!audio || !modelId) return;
    setAudioError(null);
    const params = new URLSearchParams({ sentence: lines[index].sentence.id, model: modelId });
    audio.src = `/api/tts?${params}`;
    // Loading a new src resets playbackRate, so set both.
    audio.defaultPlaybackRate = speed;
    audio.playbackRate = speed;
    setPlaying({ index, continuous });
    audio.play().catch((err: unknown) => {
      // AbortError just means another play() replaced this one.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setAudioError("Audio couldn't be played.");
        setPlaying(null);
      }
    });
  }

  function stop() {
    audioRef.current?.pause();
    setPlaying(null);
  }

  function handleEnded() {
    if (playing?.continuous && playing.index + 1 < lines.length) play(playing.index + 1, true);
    else setPlaying(null);
  }

  function handleError() {
    if (!playing) return;
    setAudioError("Audio couldn't be loaded for this line. Try again, or switch model.");
    setPlaying(null);
  }

  function changeSpeed(s: number) {
    setSpeed(s);
    if (audioRef.current) audioRef.current.playbackRate = s;
  }

  // Characters alternate sides by order of first appearance.
  const speakerOrder = [...new Set(lines.map((l) => l.character.id))];

  return (
    <div>
      {audioEnabled && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <button
              type="button"
              onClick={() => (playing?.continuous ? stop() : play(0, true))}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white dark:text-background"
            >
              {playing?.continuous ? "■ Stop" : "▶ Play conversation"}
            </button>

            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Voice model</span>
              <select
                value={modelId}
                onChange={(e) => chooseModel(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1"
              >
                {ttsModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="flex items-center gap-1 text-sm">
              <legend className="sr-only">Playback speed</legend>
              <span className="mr-1 text-muted">Speed</span>
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => changeSpeed(s)}
                  aria-pressed={speed === s}
                  className={`rounded-md px-2 py-1 ${speed === s ? "bg-accent-soft font-medium text-accent" : "text-muted hover:text-foreground"}`}
                >
                  {s}×
                </button>
              ))}
            </fieldset>
          </div>
          <p className="mt-2 text-xs text-muted">
            AI-generated audio{currentModel ? ` (${currentModel.label})` : ""}. Pronunciation may contain errors.
          </p>
          {audioError && (
            <p role="alert" className="mt-2 text-sm text-warn">
              {audioError}
            </p>
          )}
          <audio ref={audioRef} onEnded={handleEnded} onError={handleError} preload="none" className="hidden" />
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          aria-pressed={showAll}
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:border-accent"
        >
          {showAll ? "Hide all translations" : "Show all translations"}
        </button>
      </div>

      <ol className="mt-4 space-y-3">
        {lines.map(({ character, sentence }, i) => {
          const visible = showAll || revealed.has(i);
          const rightSide = speakerOrder.indexOf(character.id) % 2 === 1;
          const isPlaying = playing?.index === i;
          return (
            <li key={i} className={`flex ${rightSide ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl border p-3 transition-colors ${
                  isPlaying ? "border-accent" : "border-border"
                } ${rightSide ? "bg-accent-soft" : "bg-surface"}`}
              >
                <div className="flex items-start gap-2">
                  {audioEnabled && (
                    <button
                      type="button"
                      onClick={() => (isPlaying ? stop() : play(i, false))}
                      aria-label={isPlaying ? `Stop line ${i + 1}` : `Play line ${i + 1}`}
                      className="mt-4 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-xs text-accent hover:border-accent"
                    >
                      {isPlaying ? "■" : "▶"}
                    </button>
                  )}
                  <div>
                    <p className="text-xs font-medium text-muted">{character.name}</p>
                    <p lang={sentence.language} className="mt-0.5 text-lg">
                      {sentence.text}
                    </p>
                    {visible && <p className="mt-1 text-sm text-muted">{sentence.translation}</p>}
                    <OriginNote origin={sentence.origin} />
                    {!showAll && (
                      <button
                        type="button"
                        onClick={() => toggleLine(i)}
                        aria-expanded={visible}
                        className="mt-1 text-xs font-medium text-accent hover:underline"
                      >
                        {visible ? "Hide English" : "Show English"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Small label under each line saying where it came from. */
function OriginNote({ origin }: { origin: ContentOrigin }) {
  const tone =
    origin.type !== "ai_generated" ? "text-muted" : origin.confidence >= 85 ? "text-accent" : origin.confidence >= 75 ? "text-muted" : "text-warn";
  return (
    <p
      className={`mt-1 text-[11px] ${tone}`}
      title={
        origin.type === "ai_generated"
          ? `Self-assessed by the AI that wrote it (${origin.model}). Not a review by a Māori language expert.`
          : undefined
      }
    >
      {origin.type === "ai_generated" ? "🤖 " : ""}
      {originLabel(origin)}
    </p>
  );
}
