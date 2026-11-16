"use client";

import Link from "next/link";
import { ProgressBar } from "@/features/progress/components/progress-bar";
import { useHydrated, useProgress } from "@/features/progress/store";

export type TopicCard = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  conversationKeys: string[];
};

export function TopicGrid({ topics }: { topics: TopicCard[] }) {
  const progress = useProgress();
  const hydrated = useHydrated();

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {topics.map((topic) => {
        const total = topic.conversationKeys.length;
        const done = hydrated ? topic.conversationKeys.filter((k) => progress.completed[k]).length : 0;
        const complete = total > 0 && done === total;
        return (
          <li key={topic.slug}>
            <Link
              href={`/conversations/${topic.slug}`}
              className="group flex h-full gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-accent hover:shadow-sm"
            >
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-2xl transition group-hover:scale-110"
              >
                {topic.icon}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="flex items-center gap-2 font-medium">
                  {topic.name}
                  {complete && <span className="text-xs text-accent">✓ Complete</span>}
                </h2>
                <p className="mt-0.5 text-sm text-muted">{topic.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <ProgressBar value={done} max={total} label={`${topic.name} progress`} />
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {done}/{total}
                  </span>
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
