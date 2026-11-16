"use client";

import Link from "next/link";
import { useState } from "react";
import { streakDays } from "@/features/progress/rules";
import { completeConversation, useHydrated, useProgress } from "@/features/progress/store";

/**
 * End-of-conversation panel: complete the level, earn XP, unlock the next one.
 * (Later, completion will come from passing the conversation's exercises.)
 */
export function CompleteLevel({
  conversationKey,
  xp,
  next,
  topicHref,
}: {
  conversationKey: string;
  xp: number;
  next?: { href: string; title: string; level: number };
  topicHref: string;
}) {
  const progress = useProgress();
  const hydrated = useHydrated();
  const [justCompleted, setJustCompleted] = useState(false);

  if (!hydrated) return null;
  const alreadyDone = Boolean(progress.completed[conversationKey]);

  if (!alreadyDone) {
    return (
      <section className="mt-10 rounded-2xl border border-accent bg-accent-soft p-5 text-center">
        <h2 className="font-semibold">Finished practising?</h2>
        <p className="mt-1 text-sm text-muted">Read it through, listen, and try saying each line aloud. Then complete the level.</p>
        <button
          type="button"
          onClick={() => setJustCompleted(completeConversation(conversationKey, xp))}
          className="mt-4 rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-sm transition hover:scale-105 active:scale-95 dark:text-background"
        >
          Complete level · ⚡ +{xp} XP
        </button>
      </section>
    );
  }

  const streak = streakDays(progress.activeDays, new Date());
  return (
    <section
      className={`mt-10 rounded-2xl border border-accent bg-accent-soft p-5 text-center ${justCompleted ? "animate-pop" : ""}`}
      aria-live="polite"
    >
      {justCompleted ? (
        <>
          <p className="text-4xl" aria-hidden>
            🎉
          </p>
          <h2 className="mt-1 text-xl font-semibold">Ka pai! Level complete</h2>
          <p className="mt-1 text-sm">
            ⚡ +{xp} XP{streak > 0 && <> · 🔥 {streak}-day streak</>}
          </p>
        </>
      ) : (
        <h2 className="font-semibold">✓ Completed. Practise it as often as you like.</h2>
      )}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {next ? (
          <Link href={next.href} className="rounded-xl bg-accent px-5 py-2.5 font-semibold text-white dark:text-background">
            {justCompleted ? "🔓 " : ""}Next: Level {next.level}, {next.title} →
          </Link>
        ) : (
          <p className="w-full text-sm font-medium text-accent">🏆 You&apos;ve finished every level in this topic!</p>
        )}
        <Link href={topicHref} className="rounded-xl border border-border bg-surface px-5 py-2.5 font-medium">
          Back to topic
        </Link>
      </div>
    </section>
  );
}
