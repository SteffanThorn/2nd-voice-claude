import Link from "next/link";

// Shown when someone visits /conversations/<something that isn't a topic>.
export default function TopicNotFound() {
  return (
    <section className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Topic not found</h1>
      <p className="mt-2 text-muted">That topic doesn&apos;t exist.</p>
      <Link href="/conversations" className="mt-4 inline-block text-accent hover:underline">
        See all topics
      </Link>
    </section>
  );
}
