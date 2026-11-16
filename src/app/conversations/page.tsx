import type { Metadata } from "next";
import { TopicGrid, type TopicCard } from "@/features/conversations/components/topic-grid";
import { getConversationsForTopic } from "@/features/conversations/repository";
import { TOPICS } from "@/features/conversations/topics";
import { StatsBar } from "@/features/progress/components/stats-bar";
import { conversationKey } from "@/features/progress/rules";

export const metadata: Metadata = { title: "Conversations" };

// Server Component: gathers the data, then hands plain data (props) to the
// interactive TopicGrid, which adds the learner's progress in the browser.
export default function ConversationsPage() {
  const topics: TopicCard[] = TOPICS.map((t) => ({
    slug: t.slug,
    name: t.name,
    description: t.description,
    icon: t.icon,
    conversationKeys: getConversationsForTopic(t.slug).map((c) => conversationKey(t.slug, c.slug)),
  }));

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Conversations</h1>
      <p className="mt-2 text-muted">Pick any topic. Each one is its own path: finish a level to unlock the next.</p>
      <div className="mt-6">
        <StatsBar />
      </div>
      <div className="mt-6">
        <TopicGrid topics={topics} />
      </div>
    </>
  );
}
