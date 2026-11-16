"use client";

// Client Component: it needs usePathname() (a browser-side hook) to
// highlight the section you're currently in.

import Link from "next/link";
import { usePathname } from "next/navigation";

// Only sections that actually work are listed. Grammar, Revision and
// Profile get added here as each one is built.
const SECTIONS = [{ href: "/conversations", label: "Conversations" }] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          2nd Voice
        </Link>
        <nav aria-label="Main">
          <ul className="flex gap-1">
            {SECTIONS.map((s) => {
              const active = pathname.startsWith(s.href);
              return (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      active ? "bg-accent-soft text-accent" : "text-muted hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
