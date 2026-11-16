"use client";

import { streakDays, totalXp } from "../rules";
import { useHydrated, useProgress } from "../store";

/** XP, streak and levels completed, for the whole app. */
export function StatsBar() {
  const progress = useProgress();
  const hydrated = useHydrated();
  const xp = totalXp(progress);
  // Only read today's date in the browser: a pre-built page would freeze it.
  const streak = hydrated ? streakDays(progress.activeDays, new Date()) : 0;
  const levels = Object.keys(progress.completed).length;

  const stats = [
    { icon: "⚡", value: xp, label: "XP" },
    { icon: "🔥", value: streak, label: "day streak" },
    { icon: "⭐", value: levels, label: levels === 1 ? "level done" : "levels done" },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-surface px-3 py-2 text-center">
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <span aria-hidden className="mr-1">
              {s.icon}
            </span>
            <span className="text-lg font-semibold tabular-nums">{hydrated ? s.value : "–"}</span>
            <span className="block text-xs text-muted">{s.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
