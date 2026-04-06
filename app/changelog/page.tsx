import type { Metadata } from 'next'
import { MarketingShell } from '@/app/components/MarketingShell'
import { changelog, CATEGORY_META, type ChangelogEntry } from '@/lib/changelog'

export const metadata: Metadata = {
  title: 'Changelog | Renovo AI',
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
      className="scroll-mt-24 border-b border-zinc-200 py-10 first:pt-0 last:border-0"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
          {entry.title}
        </h2>
        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
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

export default function ChangelogPage() {
  return (
    <MarketingShell currentPath="/changelog">
      <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <header className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
            Changelog
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 md:text-4xl">
            What&apos;s new in Renovo AI
          </h1>
          <p className="mt-3 text-base text-zinc-500">
            All the latest features, improvements, and fixes shipped to the
            platform. Subscribe to stay in the loop.
          </p>
        </header>

        <div>
          {changelog.map((entry) => (
            <ReleaseCard key={entry.version} entry={entry} />
          ))}
        </div>
      </div>
    </MarketingShell>
  )
}
