import Link from "next/link";

export default function HomePage() {
  return (
    <section className="max-w-xl py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Learn te reo Māori through conversation</h1>
      <p className="mt-3 text-muted">
        Pick a topic that matters to you and learn the language people actually use in it.
      </p>
      <Link
        href="/conversations"
        className="mt-6 inline-block rounded-lg bg-accent px-5 py-3 font-medium text-white dark:text-background"
      >
        Choose a topic
      </Link>
    </section>
  );
}
