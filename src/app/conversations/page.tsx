import type { Metadata } from "next";
import Link from "next/link";
import { TOPICS } from "@/features/conversations/topics";

export const metadata: Metadata = { title: "Conversations" };

// Server Component (the default): it runs on the server and sends
// finished HTML, so no JavaScript is needed in the browser for this list.
export default function ConversationsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
      <p className="mt-2 text-muted">Choose a topic. Each topic has its own levels, which you work through in order.</p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <li key={topic.slug}>
            <Link
              href={`/conversations/${topic.slug}`}
              className="block h-full rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
            >
              <h2 className="font-medium">{topic.name}</h2>
              <p className="mt-1 text-sm text-muted">{topic.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
