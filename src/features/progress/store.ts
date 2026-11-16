/**
 * Learner progress, saved in this browser (localStorage).
 *
 * TEMPORARY: there are no accounts yet. When sign-in arrives, progress
 * moves to the database (user_step_progress) and this store becomes a
 * thin client over that API. Until then, progress is per-browser and is
 * lost if site data is cleared.
 */

import { useSyncExternalStore } from "react";
import { EMPTY_PROGRESS, parseProgress, withCompletion, type ProgressData } from "./rules";

const STORAGE_KEY = "2ndvoice.progress.v1";

let cachedRaw: string | null | undefined;
let cached: ProgressData = EMPTY_PROGRESS;
/** Used if the browser blocks storage (e.g. some private modes). */
let memoryOnly: ProgressData | null = null;
const listeners = new Set<() => void>();

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): ProgressData {
  if (memoryOnly) return memoryOnly;
  const raw = readRaw();
  // Same text → same object, so React doesn't re-render needlessly.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parseProgress(raw);
  }
  return cached;
}

function getServerSnapshot(): ProgressData {
  return EMPTY_PROGRESS;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  // Keep other open tabs in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function save(next: ProgressData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    memoryOnly = next;
  }
  listeners.forEach((l) => l());
}

/** React hook: the learner's current progress (empty during server render). */
export function useProgress(): ProgressData {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Marks a conversation complete. Returns false if it was already complete (no double XP). */
export function completeConversation(key: string, xp: number, now = new Date()): boolean {
  const current = getSnapshot();
  const next = withCompletion(current, key, xp, now);
  if (next === current) return false;
  save(next);
  return true;
}

const noopSubscribe = () => () => {};
/**
 * True once the page is running in the browser. Lets components show a
 * neutral state first, instead of flashing "locked" before saved progress loads.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}
