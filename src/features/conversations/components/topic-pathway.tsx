"use client";

/**
 * The gamified level path for one topic: nodes connected by a trail,
 * each completed / available / locked. Unlocking is sequential within
 * this topic only.
 */

import Link from "next/link";
import { ProgressBar } from "@/features/progress/components/progress-bar";
import { levelStates, type LevelState } from "@/features/progress/rules";
import { useHydrated, useProgress } from "@/features/progress/store";

export type PathwayLevel = {
  key: string;
  href: string;
  level: number;
  title: string;
  description: string;
  difficultyLabel: string;
  lineCount: number;
  xp: number;
};

export function TopicPathway({ topicName, topicIcon, levels }: { topicName: string; topicIcon: string; levels: PathwayLevel[] }) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const states: (LevelState | "loading")[] = hydrated
    ? levelStates(levels.map((l) => l.key), progress.completed)
    : levels.map(() => "loading");

  const doneCount = states.filter((s) => s === "completed").length;
  const earned = levels.reduce((sum, l) => sum + (progress.completed[l.key]?.xp ?? 0), 0);
  const possible = levels.reduce((sum, l) => sum + l.xp, 0);

  return (
    <>
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border bg-surface p-4">
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-4xl">
          {topicIcon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {hydrated ? `${doneCount} of ${levels.length} levels` : `${levels.length} levels`} · ⚡ {hydrated ? earned : 0}/
            {possible} XP
          </p>
          <div className="mt-2">
            <ProgressBar value={hydrated ? doneCount : 0} max={levels.length} label={`${topicName} progress`} />
          </div>
          {hydrated && doneCount === levels.length && (
            <p className="mt-2 text-sm font-medium text-accent">🏆 Topic complete. Ka mau te wehi!</p>
          )}
        </div>
      </div>

      <ol className="relative mt-8">
        {levels.map((level, i) => {
          const state = states[i];
          const last = i === levels.length - 1;
          return (
            <li key={level.key} className="relative flex gap-4 pb-8 last:pb-0">
              {/* The trail between nodes */}
              {!last && (
                <span
                  aria-hidden
                  className={`absolute left-7 top-14 -ml-px h-[calc(100%-3.5rem)] w-0.5 ${
                    state === "completed" ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
              <LevelNode state={state} level={level.level} />
              <LevelCard level={level} state={state} />
            </li>
          );
        })}
      </ol>
    </>
  );
}

function LevelNode({ state, level }: { state: LevelState | "loading"; level: number }) {
  const base = "relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold";
  if (state === "completed") return <span className={`${base} bg-accent text-white dark:text-background`} aria-hidden>✓</span>;
  if (state === "available")
    return (
      <span className={`${base} border-2 border-accent bg-surface text-accent`} aria-hidden>
        <span className="absolute inset-0 animate-ping rounded-full border-2 border-accent opacity-30 motion-reduce:hidden" />
        {level}
      </span>
    );
  if (state === "locked") return <span className={`${base} border-2 border-border bg-background text-muted`} aria-hidden>🔒</span>;
  return <span className={`${base} border-2 border-border bg-surface text-muted`} aria-hidden>{level}</span>;
}

function LevelCard({ level, state }: { level: PathwayLevel; state: LevelState | "loading" }) {
  const meta = (
    <p className="text-xs font-medium text-muted">
      Level {level.level} · {level.difficultyLabel} · {level.lineCount} lines · ⚡ {level.xp} XP
    </p>
  );
  const body = (
    <>
      {meta}
      <h2 className="mt-1 font-semibold">{level.title}</h2>
      <p className="mt-0.5 text-sm text-muted">{level.description}</p>
    </>
  );

  if (state === "locked") {
    return (
      <div className="flex-1 rounded-2xl border border-dashed border-border p-4 opacity-70">
        {body}
        <p className="mt-2 text-xs text-muted">Complete level {level.level - 1} to unlock</p>
      </div>
    );
  }

  const cta =
    state === "completed" ? "Practise again" : state === "available" ? (level.level === 1 ? "Start" : "Continue") : "Open";
  return (
    <Link
      href={level.href}
      className={`flex-1 rounded-2xl border bg-surface p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${
        state === "available" ? "border-accent" : "border-border hover:border-accent"
      }`}
    >
      {body}
      <span
        className={`mt-3 inline-block rounded-lg px-3 py-1.5 text-sm font-medium ${
          state === "available" ? "bg-accent text-white dark:text-background" : "bg-accent-soft text-accent"
        }`}
      >
        {cta} →
      </span>
    </Link>
  );
}
