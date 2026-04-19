import type { Metadata } from 'next'
import { MarketingShell } from '@/app/components/MarketingShell'
import { getChangelog, CATEGORY_META, type ChangelogEntry } from '@/lib/changelog'

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
      className="scroll-mt-24 border-b border-white/10 py-10 first:pt-0 last:border-0"
    >
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-white">
          {entry.title}
        </h2>
        <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-xs font-medium text-white/65">
          v{entry.version}
        </span>
        <time
          dateTime={entry.date}
          className="text-xs text-white/40"
        >
          {new Date(entry.date).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-white/65">
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
                  className="relative text-sm text-white/80 before:absolute before:-left-3 before:top-[0.6em] before:h-1 before:w-1 before:rounded-full before:bg-white/20"
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

export default async function ChangelogPage() {
  const changelog = await getChangelog()

  return (
    <MarketingShell currentPath="/changelog">
      <div className="mx-auto max-w-2xl px-6 py-20 md:py-28">
        <header className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-400">
            Changelog
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            What shipped, and when.
          </h1>
          <p className="mt-3 text-base leading-7 text-white/55">
            Every material product change, tagged with a version and a date. Breaking changes and API additions are called out so integration partners have time to plan.
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
