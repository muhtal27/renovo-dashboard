'use client'

import { useMemo, useState } from 'react'
import { OperatorLayout } from '@/app/operator-layout'

export type RegionFilter = 'all' | 'england-wales' | 'scotland'

export type KnowledgeArticle = {
  title: string
  category: string
  regions: RegionFilter[]
  summary: string
  content: string
  sourceLabel: string
  sourceHref: string
}

type CategoryFilter =
  | 'All'
  | 'Scotland'
  | 'Deposit Schemes'
  | 'Evidence and Documentation'
  | 'Dispute Handling'

const LAST_REVIEWED = 'March 2026'

const CATEGORY_ITEMS = [
  'Fair wear and tear',
  'Betterment and proportionality',
  'Evidence requirements',
  'Cleaning claims',
  'Damage and redecoration',
  'Missing items',
  'Rent arrears',
  'Scheme and dispute process',
  'Scotland notes',
  'Templates and checklists',
] as const

const CATEGORY_FILTERS: CategoryFilter[] = [
  'All',
  'Scotland',
  'Deposit Schemes',
  'Evidence and Documentation',
  'Dispute Handling',
]

function getSourceTone(label: string) {
  switch (label) {
    case 'GOV.UK':
    case 'GOV.SCOT':
    case 'Housing & Property Chamber':
    case 'Letting Agent Register':
      return 'border border-stone-300 bg-stone-100 text-stone-700'
    case 'TDS':
      return 'border border-sky-200 bg-sky-50 text-sky-800'
    case 'DPS':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'mydeposits':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'mygov.scot':
    case 'SafeDeposits Scotland':
      return 'border border-blue-200 bg-blue-50 text-blue-800'
    default:
      return 'border border-stone-200 bg-stone-50 text-stone-700'
  }
}

function getReadingTime(text: string) {
  const words = text.split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

function renderInlineFormatting(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((segment, index) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={`${segment}-${index}`}>{segment.slice(2, -2)}</strong>
    }

    return <span key={`${segment}-${index}`}>{segment}</span>
  })
}

function renderContent(content: string) {
  return content
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((block, blockIndex) => {
      const lines = block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)

      const bulletLines = lines.every((line) => line.startsWith('- '))
      const numberedLines = lines.every((line) => /^\d+\.\s+/.test(line))

      if (bulletLines) {
        return (
          <ul key={blockIndex} className="mt-3 space-y-2 list-none">
            {lines.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm leading-7 text-stone-600">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-stone-400 shrink-0" />
                <span>{renderInlineFormatting(line.replace(/^- /, ''))}</span>
              </li>
            ))}
          </ul>
        )
      }

      if (numberedLines) {
        return (
          <div key={blockIndex} className="mt-3 space-y-2">
            {lines.map((line) => {
              const match = line.match(/^(\d+)\.\s+(.*)$/)

              if (!match) {
                return null
              }

              return (
                <div key={line} className="flex items-start gap-3">
                  <span className="text-sm font-medium text-stone-500">{match[1]}.</span>
                  <span className="text-sm leading-7 text-stone-600">
                    {renderInlineFormatting(match[2])}
                  </span>
                </div>
              )
            })}
          </div>
        )
      }

      return (
        <p key={blockIndex} className="text-sm leading-7 text-stone-600">
          {renderInlineFormatting(block)}
        </p>
      )
    })
}

export default function KnowledgeClient({ articles }: { articles: KnowledgeArticle[] }) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)

  const baseArticles = useMemo(
    () =>
      articles.filter((article) =>
        regionFilter === 'all' ? true : article.regions.includes(regionFilter)
      ),
    [articles, regionFilter]
  )

  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryFilter, number>([['All', baseArticles.length]])

    for (const filter of CATEGORY_FILTERS.slice(1)) {
      counts.set(
        filter,
        baseArticles.filter((article) => article.category === filter).length
      )
    }

    return counts
  }, [baseArticles])

  const visibleArticles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return baseArticles.filter((article) => {
      const matchesCategory =
        categoryFilter === 'All' ? true : article.category === categoryFilter
      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [article.title, article.summary, article.category, article.content].some((value) =>
              value.toLowerCase().includes(normalizedQuery)
            )

      return matchesCategory && matchesSearch
    })
  }, [baseArticles, categoryFilter, searchQuery])

  const relatedArticles = useMemo(() => {
    if (!selectedArticle) {
      return []
    }

    return articles
      .filter(
        (article) =>
          article.category === selectedArticle.category && article.title !== selectedArticle.title
      )
      .slice(0, 3)
  }, [articles, selectedArticle])

  function clearSearch() {
    setSearchQuery('')
    setCategoryFilter('All')
  }

  return (
    <OperatorLayout
      pageTitle="Deposit Guidance"
      pageDescription="Authoritative scheme, evidence, and deduction guidance for end-of-tenancy decision-making."
    >
      <section className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl rounded-[1.45rem] border border-emerald-200 bg-emerald-50/85 px-5 py-4 text-sm leading-7 text-emerald-950/85">
            Rules and scheme processes vary by UK nation. Always check the official scheme
            guidance for the tenancy location.
          </div>
          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All guidance' },
                { value: 'england-wales', label: 'England & Wales' },
                { value: 'scotland', label: 'Scotland' },
              ].map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setRegionFilter(filter.value as RegionFilter)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    regionFilter === filter.value
                      ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                      : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-white hover:text-stone-900'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="w-full xl:w-[320px]">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search the guidance library"
                className="app-field h-11 w-full rounded-[1rem] border border-stone-200 bg-white px-4 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="app-kicker">Categories</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
              Guidance topics for deposit-claim review
            </h2>
          </div>
          <p className="hidden text-sm text-stone-500 md:block">
            Filtered for{' '}
            {regionFilter === 'all'
              ? 'all UK guidance'
              : regionFilter === 'england-wales'
                ? 'England & Wales'
                : 'Scotland'}
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {CATEGORY_ITEMS.map((item) => (
            <article
              key={item}
              className="rounded-[1.35rem] border border-stone-200 bg-white/92 px-4 py-4"
            >
              <p className="text-sm font-medium text-stone-800">{item}</p>
            </article>
          ))}
        </div>

        <div className="relative mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2 pr-8 md:flex-wrap md:overflow-visible md:pr-0">
            {CATEGORY_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setCategoryFilter(filter)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  categoryFilter === filter
                    ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200'
                    : 'border border-stone-200 bg-stone-50 text-stone-600 hover:bg-white hover:text-stone-900'
                }`}
              >
                <span>{filter}</span>
                <span className="text-stone-400">({categoryCounts.get(filter) ?? 0})</span>
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white to-transparent md:hidden" />
        </div>
      </section>

      {visibleArticles.length > 0 ? (
        <section className="grid gap-6 xl:grid-cols-2">
          {visibleArticles.map((article) => {
            const summaryReadingTime = getReadingTime(article.summary)

            return (
              <article
                key={article.title}
                className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="app-kicker">{article.category}</p>
                      {article.category === 'Scotland' ? (
                        <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Scotland
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-stone-400">{summaryReadingTime}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                      {article.title}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceTone(article.sourceLabel)}`}
                    >
                      {article.sourceLabel}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-500">
                      Last reviewed {LAST_REVIEWED}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-stone-600">{article.summary}</p>

                <div className="app-divider my-6" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={article.sourceHref}
                    target="_blank"
                    rel="noreferrer"
                    className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                  >
                    Open source
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="app-primary-button rounded-full px-4 py-2 text-sm font-medium"
                  >
                    Read article
                  </button>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <section className="app-surface rounded-[1.9rem] px-6 py-8 text-center md:px-8">
          {searchQuery.trim() ? (
            <p className="text-sm font-medium text-stone-700">
              No guidance matched{' '}
              <span className="rounded bg-amber-100 px-1 text-amber-900">
                {searchQuery.trim()}
              </span>
              .
            </p>
          ) : (
            <p className="text-sm font-medium text-stone-700">
              No guidance matched the current filters.
            </p>
          )}
          <p className="mt-2 text-sm leading-7 text-stone-500">
            Try a broader search or clear the current filter to see the full library.
          </p>
          <button
            type="button"
            onClick={clearSearch}
            className="app-secondary-button mt-5 rounded-full px-4 py-2 text-sm font-medium text-stone-700"
          >
            Clear search
          </button>
        </section>
      )}

      {selectedArticle ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/25">
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="flex-1 cursor-default"
            aria-label="Close article panel"
          />
          <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-stone-200 bg-white shadow-2xl">
            <div className="border-b border-stone-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="app-kicker">{selectedArticle.category}</p>
                    {selectedArticle.category === 'Scotland' ? (
                      <span className="inline-flex rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-xs font-medium text-blue-700">
                        Scotland
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
                    {selectedArticle.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                    <span>{getReadingTime(selectedArticle.content)}</span>
                    <span className="text-stone-300">•</span>
                    <span>Last reviewed {LAST_REVIEWED}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="text-sm text-stone-500 hover:text-stone-700 cursor-pointer"
                  >
                    Print article
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="text-sm font-medium text-stone-500 hover:text-stone-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceTone(selectedArticle.sourceLabel)}`}
                >
                  {selectedArticle.sourceLabel}
                </span>
                <a
                  href={selectedArticle.sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-700"
                >
                  Open source
                </a>
              </div>

              <p className="mt-5 text-base leading-8 text-stone-700">{selectedArticle.summary}</p>

              <div className="mt-6 space-y-5">{renderContent(selectedArticle.content)}</div>

              {relatedArticles.length > 0 ? (
                <>
                  <div className="app-divider my-6" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-stone-500">
                      More in this category
                    </h3>
                    <div className="mt-4 grid gap-3">
                      {relatedArticles.map((article) => (
                        <button
                          key={article.title}
                          type="button"
                          onClick={() => setSelectedArticle(article)}
                          className="rounded-[1.25rem] border border-stone-200 bg-stone-50 px-4 py-4 text-left transition hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-stone-900">
                              {article.title}
                            </span>
                            <span className="text-sm font-medium text-stone-500">Read →</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </OperatorLayout>
  )
}
