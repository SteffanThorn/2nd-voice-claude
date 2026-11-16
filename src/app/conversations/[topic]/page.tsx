import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VerificationBadge } from "@/components/verification-badge";
import { DIFFICULTY_LABELS } from "@/features/content/types";
import { getConversationsForTopic } from "@/features/conversations/repository";
import { TOPICS, getTopic } from "@/features/conversations/topics";

// [topic] in the folder name is a *dynamic segment*: one file serves
// /conversations/home, /conversations/work, and so on.

// Pre-build a page for every known topic at build time.
export function generateStaticParams() {
  return TOPICS.map((t) => ({ topic: t.slug }));
}

export async function generateMetadata(props: PageProps<"/conversations/[topic]">): Promise<Metadata> {
  const { topic: slug } = await props.params;
  return { title: getTopic(slug)?.name ?? "Topic" };
}

// Reading the URL (params) happens inside <Suspense>, so Next.js can show
// the page shell instantly on navigation and stream the content in.
export default function TopicPage(props: PageProps<"/conversations/[topic]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <TopicContent params={props.params} />
    </Suspense>
  );
}

async function TopicContent({ params }: Pick<PageProps<"/conversations/[topic]">, "params">) {
  const { topic: slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();
  const conversations = getConversationsForTopic(topic.slug);

  return (
    <>
      <Link href="/conversations" className="text-sm text-muted hover:text-foreground">
        ← All topics
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{topic.name}</h1>
      <p className="mt-2 text-muted">{topic.description}</p>

      {conversations.length === 0 ? (
        // Honest empty state: nothing has been written and verified yet.
        <div className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-muted">
          No conversations have been published for this topic yet.
        </div>
      ) : (
        <ol className="mt-6 space-y-3">
          {conversations.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/conversations/${topic.slug}/${c.slug}`}
                className="block rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
              >
                <p className="text-xs font-medium text-muted">
                  Level {c.level} · {DIFFICULTY_LABELS[c.difficulty]}
                </p>
                <h2 className="mt-1 flex flex-wrap items-center gap-2 font-medium">
                  {c.title}
                  <VerificationBadge status={c.verificationStatus} />
                  {c.isSample && <span className="text-xs text-warn">Sample</span>}
                </h2>
                <p className="mt-1 text-sm text-muted">{c.description}</p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}
