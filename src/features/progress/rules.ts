/**
 * Game rules: pure functions, no browser or database access.
 * Kept separate so they're easy to test and reuse when progress moves to
 * the database.
 */

export type LevelState = "completed" | "available" | "locked";

export type ProgressData = {
  version: 1;
  /** conversationKey → when it was completed and the XP awarded */
  completed: Record<string, { completedAt: string; xp: number }>;
  /** Local calendar days (YYYY-MM-DD) on which the learner completed something. */
  activeDays: string[];
};

export const EMPTY_PROGRESS: ProgressData = Object.freeze({ version: 1, completed: {}, activeDays: [] }) as ProgressData;

export function conversationKey(topicSlug: string, conversationSlug: string): string {
  return `${topicSlug}/${conversationSlug}`;
}

/**
 * Sequential unlocking within ONE pathway: a level is available only when
 * every earlier level in the same pathway is completed. Other topics never
 * affect this one.
 */
export function levelStates(orderedKeys: readonly string[], completed: ProgressData["completed"]): LevelState[] {
  let previousDone = true;
  return orderedKeys.map((key) => {
    const done = Boolean(completed[key]);
    const state: LevelState = done ? "completed" : previousDone ? "available" : "locked";
    previousDone = previousDone && done;
    return state;
  });
}

/** XP for finishing a conversation: a base amount plus a bit per line. */
export function xpForConversation(lineCount: number): number {
  return 20 + 5 * lineCount;
}

export function totalXp(progress: ProgressData): number {
  return Object.values(progress.completed).reduce((sum, c) => sum + c.xp, 0);
}

export function localDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Consecutive days with activity, counting back from today. If nothing was
 * done today yet, the streak still counts from yesterday (it isn't broken
 * until a whole day is missed).
 */
export function streakDays(activeDays: readonly string[], today: Date): number {
  const days = new Set(activeDays);
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(localDay(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Returns new progress with the conversation completed, or the same object if it already was. */
export function withCompletion(progress: ProgressData, key: string, xp: number, now: Date): ProgressData {
  if (progress.completed[key]) return progress;
  const day = localDay(now);
  return {
    version: 1,
    completed: { ...progress.completed, [key]: { completedAt: now.toISOString(), xp } },
    activeDays: progress.activeDays.includes(day) ? progress.activeDays : [...progress.activeDays, day],
  };
}

/** Accepts anything (e.g. from browser storage) and returns valid progress. */
export function parseProgress(raw: string | null): ProgressData {
  if (!raw) return EMPTY_PROGRESS;
  try {
    const data = JSON.parse(raw) as Partial<ProgressData>;
    if (data?.version !== 1 || typeof data.completed !== "object" || data.completed === null) return EMPTY_PROGRESS;
    const completed: ProgressData["completed"] = {};
    for (const [key, value] of Object.entries(data.completed)) {
      if (value && typeof value.xp === "number" && typeof value.completedAt === "string") completed[key] = value;
    }
    const activeDays = Array.isArray(data.activeDays)
      ? data.activeDays.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d))
      : [];
    return { version: 1, completed, activeDays };
  } catch {
    return EMPTY_PROGRESS;
  }
}
