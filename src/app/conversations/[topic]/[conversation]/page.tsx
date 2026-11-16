import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { VerificationBadge } from "@/components/verification-badge";
import { DIFFICULTY_LABELS } from "@/features/content/types";
import { ConversationReader } from "@/features/conversations/components/conversation-reader";
import {
  getAllConversationParams,
  getConversation,
  getConversationVocabulary,
  resolveLines,
} from "@/features/conversations/repository";
import { TOPICS, getTopic } from "@/features/conversations/topics";
import { getTtsModelsFor, toPublicInfo } from "@/services/tts/registry";

export function generateStaticParams() {
  const params = getAllConversationParams();
  // Next.js Cache Components require at least one entry here. When no
  // conversations exist (e.g. a production build before real content), we
  // pre-render one placeholder that resolves to the not-found page.
  return params.length > 0 ? params : [{ topic: TOPICS[0].slug, conversation: "__none__" }];
}

export async function generateMetadata(
  props: PageProps<"/conversations/[topic]/[conversation]">,
): Promise<Metadata> {
  const { topic, conversation } = await props.params;
  return { title: getConversation(topic, conversation)?.title ?? "Conversation" };
}

// Server Component: loads data on the server, then hands only the lines
// (plain data, passed as *props*) to the interactive ConversationReader.
export default function ConversationPage(props: PageProps<"/conversations/[topic]/[conversation]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <ConversationContent params={props.params} />
    </Suspense>
  );
}

async function ConversationContent({
  params,
}: Pick<PageProps<"/conversations/[topic]/[conversation]">, "params">) {
  const { topic: topicSlug, conversation: slug } = await params;
  const topic = getTopic(topicSlug);
  const conversation = getConversation(topicSlug, slug);
  if (!topic || !conversation) notFound();

  const lines = resolveLines(conversation);
  const vocabulary = getConversationVocabulary(conversation);
  // Only models that are configured (have API keys) AND support Māori.
  const ttsModels = getTtsModelsFor("mi").map(toPublicInfo);

  return (
    <article>
      <Link href={`/conversations/${topic.slug}`} className="text-sm text-muted hover:text-foreground">
        ← {topic.name}
      </Link>

      {conversation.isSample && (
        <div role="note" className="mt-4 rounded-lg border border-warn/40 bg-warn-soft p-3 text-sm text-warn">
          <strong>Sample content for development.</strong> This conversation was written by AI to build the screen and
          has not been checked by a Māori language reviewer. Don&apos;t learn from it.
        </div>
      )}

      <header className="mt-4">
        <p className="text-sm text-muted">
          Level {conversation.level} · {DIFFICULTY_LABELS[conversation.difficulty]}
        </p>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight">
          {conversation.title} <VerificationBadge status={conversation.verificationStatus} />
        </h1>
        <p className="mt-2 text-muted">{conversation.description}</p>
      </header>

      <section className="mt-6" aria-label="Dialogue">
        <ConversationReader lines={lines} ttsModels={ttsModels} />
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Vocabulary</h2>
        <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {vocabulary.map((v) => (
            <div key={v.id} className="flex gap-2 border-b border-border py-1.5">
              <dt lang="mi" className="font-medium">{v.headword}</dt>
              <dd className="text-muted">{v.translation}</dd>
            </div>
          ))}
        </dl>
      </section>

      {conversation.learningNotes.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Learning notes</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {conversation.learningNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 border-t border-border pt-4 text-sm text-muted">
        <h2 className="font-medium text-foreground">Source</h2>
        <ul className="mt-1 space-y-1">
          {conversation.provenance.map((p, i) => (
            <li key={i}>
              {p.description}
              {p.url && (
                <>
                  {" "}
                  <a href={p.url} className="text-accent hover:underline" rel="noopener noreferrer">
                    {p.url}
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
