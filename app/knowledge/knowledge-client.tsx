'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import {
  DetailPanel,
  EmptyState,
  FilterToolbar,
  PageHeader,
  SectionCard,
  SectionHeading,
  ToolbarPill,
} from '@/app/operator-ui'

export type RegionFilter = 'all' | 'england' | 'wales' | 'scotland' | 'northern-ireland'

export type KnowledgeArticle = {
  title: string
  category: string
  regions: RegionFilter[]
  summary: string
  content: string
  sourceLabel: string
  sourceHref: string
}

const LAST_REVIEWED = 'March 2026'

const REGION_OPTIONS: Array<{
  value: RegionFilter
  label: string
  description: string
}> = [
  {
    value: 'all',
    label: 'All UK',
    description: 'Cross-jurisdiction guidance that applies across deposit evidence, proportionality, and workflow discipline.',
  },
  {
    value: 'england',
    label: 'England',
    description: 'Deposit scheme process, prescribed information, and deduction guidance grounded in the England-specific tenancy framework.',
  },
  {
    value: 'wales',
    label: 'Wales',
    description: 'Occupation contract, notice, and deposit guidance for the Renting Homes (Wales) framework.',
  },
  {
    value: 'scotland',
    label: 'Scotland',
    description: 'Scottish tenancy framework, approved schemes, tribunal context, and Scotland-specific deposit handling.',
  },
  {
    value: 'northern-ireland',
    label: 'Northern Ireland',
    description: 'Northern Ireland deposit protection, dispute resolution, mediation, and tenancy-end compliance guidance.',
  },
]

function getSourceTone(label: string) {
  switch (label) {
    case 'GOV.UK':
    case 'GOV.SCOT':
    case 'Housing & Property Chamber':
    case 'Letting Agent Register':
    case 'nidirect':
      return 'border border-slate-300 bg-slate-100 text-slate-700'
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
      return 'border border-slate-200 bg-slate-50 text-slate-700'
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
          <ul key={blockIndex} className="mt-3 list-none space-y-2">
            {lines.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm leading-7 text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
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
                  <span className="text-sm font-medium text-slate-500">{match[1]}.</span>
                  <span className="text-sm leading-7 text-slate-600">
                    {renderInlineFormatting(match[2])}
                  </span>
                </div>
              )
            })}
          </div>
        )
      }

      return (
        <p key={blockIndex} className="text-sm leading-7 text-slate-600">
          {renderInlineFormatting(block)}
        </p>
      )
    })
}

function isArticleInRegion(article: KnowledgeArticle, region: RegionFilter) {
  if (region === 'all') {
    return true
  }

  return article.regions.includes('all') || article.regions.includes(region)
}

function getRegionLabel(regions: RegionFilter[]) {
  if (regions.includes('all')) {
    return 'All UK'
  }

  if (regions.includes('england') && regions.includes('wales')) {
    return 'England & Wales'
  }

  if (regions.includes('england')) {
    return 'England'
  }

  if (regions.includes('wales')) {
    return 'Wales'
  }

  if (regions.includes('scotland')) {
    return 'Scotland'
  }

  if (regions.includes('northern-ireland')) {
    return 'Northern Ireland'
  }

  return 'Regional guidance'
}

function getRegionChipTone(regions: RegionFilter[]) {
  if (regions.includes('scotland')) {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  if (regions.includes('northern-ireland')) {
    return 'border-violet-200 bg-violet-50 text-violet-700'
  }

  if (regions.includes('england') && regions.includes('wales')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (regions.includes('england')) {
    return 'border-teal-200 bg-teal-50 text-teal-700'
  }

  if (regions.includes('wales')) {
    return 'border-cyan-200 bg-cyan-50 text-cyan-700'
  }

  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export default function KnowledgeClient({ articles }: { articles: KnowledgeArticle[] }) {
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null)

  const deferredSearchQuery = useDeferredValue(searchQuery)

  const regionCounts = useMemo(() => {
    return Object.fromEntries(
      REGION_OPTIONS.map((region) => [
        region.value,
        articles.filter((article) => isArticleInRegion(article, region.value)).length,
      ])
    ) as Record<RegionFilter, number>
  }, [articles])

  const baseArticles = useMemo(
    () => articles.filter((article) => isArticleInRegion(article, regionFilter)),
    [articles, regionFilter]
  )

  const categoryFilters = useMemo(() => {
    const dynamicCategories = Array.from(new Set(baseArticles.map((article) => article.category))).sort()
    return ['All', ...dynamicCategories]
  }, [baseArticles])

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>([['All', baseArticles.length]])

    for (const category of categoryFilters.slice(1)) {
      counts.set(
        category,
        baseArticles.filter((article) => article.category === category).length
      )
    }

    return counts
  }, [baseArticles, categoryFilters])
  const activeCategoryFilter = categoryFilters.includes(categoryFilter) ? categoryFilter : 'All'
  const activeSelectedArticle =
    selectedArticle && isArticleInRegion(selectedArticle, regionFilter) ? selectedArticle : null

  const visibleArticles = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    return baseArticles.filter((article) => {
      const matchesCategory =
        activeCategoryFilter === 'All' ? true : article.category === activeCategoryFilter
      const matchesSearch =
        normalizedQuery.length === 0
          ? true
          : [article.title, article.summary, article.category, article.content, getRegionLabel(article.regions)]
              .join(' ')
              .toLowerCase()
              .includes(normalizedQuery)

      return matchesCategory && matchesSearch
    })
  }, [activeCategoryFilter, baseArticles, deferredSearchQuery])

  const relatedArticles = useMemo(() => {
    if (!activeSelectedArticle) {
      return []
    }

    return articles
      .filter(
        (article) =>
          article.category === activeSelectedArticle.category && article.title !== activeSelectedArticle.title
      )
      .slice(0, 3)
  }, [activeSelectedArticle, articles])

  function clearSearch() {
    setSearchQuery('')
    setCategoryFilter('All')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Guidance"
        title="Guidance hub"
        description="Authoritative deposit, evidence, and dispute guidance for the operator team. Jurisdiction rules vary, so start with the tenancy location and keep the official source close to every decision."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_320px]">
        <SectionCard className="px-6 py-6">
          <SectionHeading
            eyebrow="Jurisdictions"
            title="Choose the governing ruleset"
            description="Northern Ireland now sits alongside England, Wales, and Scotland as a first-class jurisdiction in the operator guidance model."
          />

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {REGION_OPTIONS.map((region) => {
              const active = regionFilter === region.value

              return (
                <button
                  key={region.value}
                  type="button"
                  onClick={() => setRegionFilter(region.value)}
                  className={`rounded-[20px] border px-4 py-4 text-left transition ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)]'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-950'}`}>
                        {region.label}
                      </p>
                      <p className={`mt-2 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-600'}`}>
                        {region.description}
                      </p>
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        active ? 'bg-white/10 text-white' : 'bg-white text-slate-600'
                      }`}
                    >
                      {regionCounts[region.value]}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-6">
            <FilterToolbar className="items-start">
              <div className="flex flex-wrap items-center gap-2">
                {categoryFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setCategoryFilter(filter)}
                  >
                    <ToolbarPill active={activeCategoryFilter === filter}>
                      {filter}
                      <span className="ml-2 text-xs opacity-70">({categoryCounts.get(filter) ?? 0})</span>
                    </ToolbarPill>
                  </button>
                ))}
              </div>

              <label className="relative block w-full lg:w-[320px]">
                <span className="sr-only">Search guidance</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search the guidance library"
                  className="h-11 w-full rounded-[14px] border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400"
                />
              </label>
            </FilterToolbar>
          </div>
        </SectionCard>

        <DetailPanel
          title="Library status"
          description="The operator guidance library is curated for live decision support and should be checked alongside the tenancy location."
        >
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Current scope
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
              {REGION_OPTIONS.find((region) => region.value === regionFilter)?.label}
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Visible articles
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">
              {visibleArticles.length} matching article{visibleArticles.length === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Last reviewed
            </p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-900">{LAST_REVIEWED}</p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white px-4 py-4 text-sm leading-6 text-slate-600">
            Always follow the official scheme or government guidance for the tenancy location before confirming any deduction position or dispute path.
          </div>
        </DetailPanel>
      </section>

      {visibleArticles.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {visibleArticles.map((article) => {
            const summaryReadingTime = getReadingTime(article.summary)
            const regionLabel = getRegionLabel(article.regions)

            return (
              <SectionCard key={article.title} className="px-6 py-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {article.category}
                      </span>
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRegionChipTone(
                          article.regions
                        )}`}
                      >
                        {regionLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{summaryReadingTime}</p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {article.title}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceTone(article.sourceLabel)}`}
                    >
                      {article.sourceLabel}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                      Last reviewed {LAST_REVIEWED}
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-600">{article.summary}</p>

                <div className="my-6 border-t border-slate-200" />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={article.sourceHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  >
                    Open source
                  </a>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="inline-flex items-center rounded-[14px] border border-slate-900 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    Read article
                  </button>
                </div>
              </SectionCard>
            )
          })}
        </section>
      ) : (
        <SectionCard className="px-6 py-8 md:px-8">
          <EmptyState
            title={deferredSearchQuery.trim() ? 'No guidance matched your search' : 'No guidance matched the current filters'}
            body={
              deferredSearchQuery.trim()
                ? `No guidance matched "${deferredSearchQuery.trim()}". Try a broader search or switch jurisdiction.`
                : 'Try a broader category or switch jurisdiction to widen the current guidance set.'
            }
            action={
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center rounded-[14px] border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
              >
                Clear search
              </button>
            }
          />
        </SectionCard>
      )}

      {activeSelectedArticle ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35">
          <button
            type="button"
            onClick={() => setSelectedArticle(null)}
            className="flex-1 cursor-default"
            aria-label="Close article panel"
          />
          <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {activeSelectedArticle.category}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getRegionChipTone(
                        activeSelectedArticle.regions
                      )}`}
                    >
                      {getRegionLabel(activeSelectedArticle.regions)}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                    {activeSelectedArticle.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{getReadingTime(activeSelectedArticle.content)}</span>
                    <span className="text-slate-300">•</span>
                    <span>Last reviewed {LAST_REVIEWED}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="cursor-pointer text-sm text-slate-500 hover:text-slate-700"
                  >
                    Print article
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArticle(null)}
                    className="text-sm font-medium text-slate-500 hover:text-slate-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getSourceTone(activeSelectedArticle.sourceLabel)}`}
                >
                  {activeSelectedArticle.sourceLabel}
                </span>
                <a
                  href={activeSelectedArticle.sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-700"
                >
                  Open source
                </a>
              </div>

              <p className="mt-5 text-base leading-8 text-slate-700">{activeSelectedArticle.summary}</p>

              <div className="mt-6 space-y-5">{renderContent(activeSelectedArticle.content)}</div>

              {relatedArticles.length > 0 ? (
                <>
                  <div className="my-6 border-t border-slate-200" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      More in this category
                    </h3>
                    <div className="mt-4 grid gap-3">
                      {relatedArticles.map((article) => (
                        <button
                          key={article.title}
                          type="button"
                          onClick={() => setSelectedArticle(article)}
                          className="rounded-[18px] border border-slate-200 bg-slate-50/70 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-slate-900">
                              {article.title}
                            </span>
                            <span className="text-sm font-medium text-slate-500">Read</span>
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
    </div>
  )
}
