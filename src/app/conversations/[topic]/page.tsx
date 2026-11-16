import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DIFFICULTY_LABELS } from "@/features/content/types";
import { TopicPathway, type PathwayLevel } from "@/features/conversations/components/topic-pathway";
import { getConversationsForTopic } from "@/features/conversations/repository";
import { TOPICS, getTopic } from "@/features/conversations/topics";
import { conversationKey, xpForConversation } from "@/features/progress/rules";

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

  const levels: PathwayLevel[] = getConversationsForTopic(topic.slug).map((c) => ({
    key: conversationKey(topic.slug, c.slug),
    href: `/conversations/${topic.slug}/${c.slug}`,
    level: c.level,
    title: c.title,
    description: c.description,
    difficultyLabel: DIFFICULTY_LABELS[c.difficulty],
    lineCount: c.lines.length,
    xp: xpForConversation(c.lines.length),
  }));

  return (
    <>
      <Link href="/conversations" className="text-sm text-muted hover:text-foreground">
        ← All topics
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">{topic.name}</h1>
      <p className="mt-1 text-muted">{topic.description}</p>

      {levels.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-6 text-center text-muted">
          No conversations have been published for this topic yet.
        </div>
      ) : (
        <TopicPathway topicName={topic.name} topicIcon={topic.icon} levels={levels} />
      )}
    </>
  );
}
