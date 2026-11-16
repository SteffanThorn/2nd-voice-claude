"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { levelStates } from "@/features/progress/rules";
import { useHydrated, useProgress } from "@/features/progress/store";

/**
 * Shows the conversation only if its level is unlocked. Otherwise points
 * the learner to the level they need to finish first.
 *
 * Note: progress lives in the browser for now, so this is a learning
 * guide, not a security boundary. Content isn't secret.
 */
export function LevelGate({
  pathwayKeys,
  index,
  previous,
  children,
}: {
  pathwayKeys: string[];
  index: number;
  previous?: { href: string; title: string; level: number };
  children: ReactNode;
}) {
  const progress = useProgress();
  const hydrated = useHydrated();

  if (index === 0) return <>{children}</>;
  if (!hydrated) return <p className="mt-8 text-muted">Loading…</p>;

  const state = levelStates(pathwayKeys, progress.completed)[index];
  if (state !== "locked") return <>{children}</>;

  return (
    <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
      <p className="text-4xl" aria-hidden>
        🔒
      </p>
      <h2 className="mt-2 text-lg font-semibold">This level is locked</h2>
      {previous && (
        <>
          <p className="mt-1 text-muted">
            Finish level {previous.level}, “{previous.title}”, to unlock it.
          </p>
          <Link
            href={previous.href}
            className="mt-4 inline-block rounded-lg bg-accent px-4 py-2 font-medium text-white dark:text-background"
          >
            Go to level {previous.level} →
          </Link>
        </>
      )}
    </div>
  );
}
