'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'

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

type KnowledgeArticleRecord = {
  article: KnowledgeArticle
  regionLabel: string
  summaryReadingTime: string
  contentReadingTime: string
  searchIndex: string
}

const LAST_REVIEWED = 'March 2026'

function getSourceTone(label: string) {
  switch (label) {
    case 'GOV.UK':
    case 'GOV.SCOT':
    case 'Housing & Property Chamber':
    case 'Letting Agent Register':
    case 'nidirect':
      return 'border border-zinc-300 bg-zinc-100 text-zinc-700'
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
      return 'border border-zinc-200 bg-zinc-50 text-zinc-700'
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
              <li key={line} className="flex items-start gap-2 text-sm leading-7 text-zinc-600">
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
                  <span className="text-sm font-medium text-zinc-500">{match[1]}.</span>
                  <span className="text-sm leading-7 text-zinc-600">
                    {renderInlineFormatting(match[2])}
                  </span>
                </div>
              )
            })}
          </div>
        )
      }

      return (
        <p key={blockIndex} className="text-sm leading-7 text-zinc-600">
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

  return 'border-zinc-200 bg-zinc-100 text-zinc-700'
}

export default function KnowledgeClient({ articles }: { articles: KnowledgeArticle[] }) {
  const searchParams = useSearchParams()
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '')
  const [selectedArticleTitle, setSelectedArticleTitle] = useState<string | null>(null)

  const deferredSearchQuery = useDeferredValue(searchQuery)
  const articleRecords = useMemo<KnowledgeArticleRecord[]>(
    () =>
      articles.map((article) => {
        const regionLabel = getRegionLabel(article.regions)

        return {
          article,
          regionLabel,
          summaryReadingTime: getReadingTime(article.summary),
          contentReadingTime: getReadingTime(article.content),
          searchIndex: [
            article.title,
            article.summary,
            article.category,
            article.content,
            regionLabel,
          ]
            .join(' ')
            .toLowerCase(),
        }
      }),
    [articles]
  )

  const filteredRecords = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    return articleRecords.filter(({ article, searchIndex }) => {
      const regionMatch = isArticleInRegion(article, regionFilter)
      const searchMatch = normalizedQuery.length === 0 || searchIndex.includes(normalizedQuery)
      return regionMatch && searchMatch
    })
  }, [articleRecords, regionFilter, deferredSearchQuery])

  const activeSelectedArticle =
    selectedArticleTitle == null
      ? null
      : articleRecords.find(
          ({ article }) =>
            article.title === selectedArticleTitle && isArticleInRegion(article, regionFilter)
        ) ?? null

  const relatedArticleRecords = useMemo(() => {
    if (!activeSelectedArticle) return []
    return articleRecords
      .filter(
        ({ article }) =>
          article.category === activeSelectedArticle.article.category &&
          article.title !== activeSelectedArticle.article.title
      )
      .slice(0, 3)
  }, [activeSelectedArticle, articleRecords])

  const regionLabels: Array<{ value: RegionFilter; label: string }> = [
    { value: 'all', label: 'All regions' },
    { value: 'england', label: 'England' },
    { value: 'wales', label: 'Wales' },
    { value: 'scotland', label: 'Scotland' },
    { value: 'northern-ireland', label: 'Northern Ireland' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {regionLabels.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setRegionFilter(value)}
            className={`px-3 py-1.5 text-xs font-medium transition ${
              regionFilter === value
                ? 'border border-zinc-900 bg-zinc-900 text-white'
                : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}

        <label className="relative ml-auto block w-full sm:w-[280px]">
          <span className="sr-only">Search guidance</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search guidance..."
            className="h-9 w-full border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
          />
        </label>
      </div>

      <div className="space-y-3">
        {filteredRecords.length > 0 ? (
          filteredRecords.map(({ article, regionLabel }) => (
            <button
              key={article.title}
              type="button"
              onClick={() => setSelectedArticleTitle(article.title)}
              className="block w-full border border-zinc-200/80 bg-white px-5 py-4 text-left transition hover:border-zinc-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-950">{article.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{article.summary}</p>
                </div>
                <span className="shrink-0 border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
                  {article.category}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                {article.regions.map((region, index) => (
                  <span key={region} className="flex items-center gap-2">
                    {index > 0 ? <span className="text-zinc-200">&middot;</span> : null}
                    <span className="text-[10px] font-medium text-zinc-400">{region}</span>
                  </span>
                ))}
              </div>
            </button>
          ))
        ) : (
          <div className="border border-zinc-200/80 bg-white px-5 py-8 text-center text-sm text-zinc-500">
            No articles match your filters.
          </div>
        )}
      </div>

      {activeSelectedArticle ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/35">
          <button
            type="button"
            onClick={() => setSelectedArticleTitle(null)}
            className="flex-1 cursor-default"
            aria-label="Close article panel"
          />
          <aside className="relative flex h-full w-full max-w-2xl flex-col border-l border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                      {activeSelectedArticle.article.category}
                    </span>
                    <span
                      className={`inline-flex border px-2.5 py-1 text-xs font-medium ${getRegionChipTone(
                        activeSelectedArticle.article.regions
                      )}`}
                    >
                      {activeSelectedArticle.regionLabel}
                    </span>
                  </div>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                    {activeSelectedArticle.article.title}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span>{activeSelectedArticle.contentReadingTime}</span>
                    <span className="text-zinc-300">&bull;</span>
                    <span>Last reviewed {LAST_REVIEWED}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="cursor-pointer text-sm text-zinc-500 hover:text-zinc-700"
                  >
                    Print
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArticleTitle(null)}
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold ${getSourceTone(activeSelectedArticle.article.sourceLabel)}`}
                >
                  {activeSelectedArticle.article.sourceLabel}
                </span>
                <a
                  href={activeSelectedArticle.article.sourceHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-zinc-500 underline decoration-slate-300 underline-offset-4 hover:text-zinc-700"
                >
                  Open source
                </a>
              </div>

              <p className="mt-5 text-base leading-8 text-zinc-700">{activeSelectedArticle.article.summary}</p>

              <div className="mt-6 space-y-5">{renderContent(activeSelectedArticle.article.content)}</div>

              {relatedArticleRecords.length > 0 ? (
                <>
                  <div className="my-6 border-t border-zinc-200" />
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">
                      More in this category
                    </h3>
                    <div className="mt-4 grid gap-3">
                      {relatedArticleRecords.map(({ article }) => (
                        <button
                          key={article.title}
                          type="button"
                          onClick={() => setSelectedArticleTitle(article.title)}
                          className="border border-zinc-200 bg-zinc-50/70 px-4 py-4 text-left transition hover:border-zinc-300 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-zinc-900">
                              {article.title}
                            </span>
                            <span className="text-sm font-medium text-zinc-500">Read</span>
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
