import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getChangelog, CATEGORY_META, type ChangelogEntry } from '@/lib/changelog'

export const metadata: Metadata = {
  title: "What's new | Renovo AI",
  description:
    'See what is new in Renovo AI. Release notes covering new features, improvements, and fixes.',
}

function CategoryBadge({ category }: { category: keyof typeof CATEGORY_META }) {
  const meta = CATEGORY_META[category]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function ReleaseCard({ entry }: { entry: ChangelogEntry }) {
  return (
    <article
      id={`v${entry.version}`}
      className="scroll-mt-24 border-b border-zinc-200/60 py-10 first:pt-0 last:border-0 animate-fade-in-up"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
          {entry.title}
        </h2>
        <span className="rounded-full bg-zinc-100 ring-1 ring-zinc-200/50 px-2 py-0.5 text-xs font-medium text-zinc-600">
          v{entry.version}
        </span>
        <time
          dateTime={entry.date}
          className="text-xs text-zinc-400"
        >
          {new Date(entry.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-zinc-600">
        {entry.summary}
      </p>

      <div className="mt-5 space-y-4">
        {entry.changes.map((group) => (
          <div key={group.category}>
            <CategoryBadge category={group.category} />
            <ul className="mt-2 space-y-1.5 pl-4">
              {group.items.map((item, i) => (
                <li
                  key={i}
                  className="relative text-sm text-zinc-700 before:absolute before:-left-3 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-zinc-300"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </article>
  )
}

export default async function WhatsNewPage() {
  const changelog = await getChangelog()

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up">
      <header className="mb-10">
        <Link
          href="/dashboard"
          prefetch={false}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to dashboard
        </Link>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
          Changelog
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-950">
          What&apos;s new
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Latest features, improvements, and fixes.
        </p>
      </header>

      <div>
        {changelog.map((entry) => (
          <ReleaseCard key={entry.version} entry={entry} />
        ))}
      </div>
    </div>
  )
}
