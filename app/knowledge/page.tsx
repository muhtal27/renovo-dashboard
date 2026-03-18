'use client'

import Link from 'next/link'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getOperatorLabel,
  getOperatorProfile,
  getSessionUser,
  type CurrentOperator,
} from '@/lib/operator'
import { supabase } from '@/lib/supabase'

type KnowledgeArticleRow = {
  id: string
  title: string
  category: string
  content: string
  is_active: boolean
  source_url: string | null
  source_authority: 'official' | 'operator' | 'internal'
  jurisdiction: 'scotland' | 'uk' | 'england' | 'wales' | 'mixed'
  audience: string[] | null
  article_kind: 'guidance' | 'faq' | 'process' | 'legal_summary' | 'template' | 'policy'
  review_status: 'draft' | 'approved' | 'archived'
  reviewed_at: string | null
  effective_from: string | null
  source_updated_at: string | null
  keywords: string[] | null
  updated_at: string | null
}

type KnowledgeSearchRow = {
  article_id: string
  chunk_id: string | null
  title: string
  category: string
  snippet: string
  source_url: string | null
  source_authority: 'official' | 'operator' | 'internal'
  jurisdiction: 'scotland' | 'uk' | 'england' | 'wales' | 'mixed'
  review_status: 'draft' | 'approved' | 'archived'
  source_updated_at: string | null
  score: number
}

function formatLongDate(value: string | null) {
  if (!value) return 'Not set'

  return new Date(value).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatCategoryLabel(value: string) {
  return value.replace(/_/g, ' ')
}

function getReviewTone(status: KnowledgeArticleRow['review_status']) {
  if (status === 'approved') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'archived') return 'border-stone-200 bg-stone-100 text-stone-600'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

function getAuthorityTone(authority: KnowledgeArticleRow['source_authority']) {
  if (authority === 'official') return 'border-sky-200 bg-sky-50 text-sky-700'
  if (authority === 'operator') return 'border-violet-200 bg-violet-50 text-violet-700'
  return 'border-stone-200 bg-stone-50 text-stone-700'
}

export default function KnowledgePage() {
  const router = useRouter()

  const [operator, setOperator] = useState<CurrentOperator | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [articles, setArticles] = useState<KnowledgeArticleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchResults, setSearchResults] = useState<KnowledgeSearchRow[] | null>(null)

  const hydrateOperatorProfile = useEffectEvent(async (userId: string) => {
    try {
      const profile = await getOperatorProfile(userId)

      setOperator((current) => {
        if (!current?.authUser || current.authUser.id !== userId) return current
        return {
          ...current,
          profile,
        }
      })

      if (profile?.is_active === false) {
        setError('Your operator profile is inactive. Please contact an administrator.')
      }
    } catch (profileError) {
      setError(
        profileError instanceof Error
          ? profileError.message
          : 'Unable to load operator profile.'
      )
    }
  })

  const loadArticles = useEffectEvent(async () => {
    setLoading(true)
    setError(null)

    const { data, error: articlesError } = await supabase
      .from('knowledge_articles')
      .select(`
        id,
        title,
        category,
        content,
        is_active,
        source_url,
        source_authority,
        jurisdiction,
        audience,
        article_kind,
        review_status,
        reviewed_at,
        effective_from,
        source_updated_at,
        keywords,
        updated_at
      `)
      .eq('is_active', true)
      .eq('review_status', 'approved')
      .in('jurisdiction', ['scotland', 'uk'])
      .order('source_updated_at', { ascending: false })
      .order('updated_at', { ascending: false })

    if (articlesError) {
      setError(articlesError.message)
      setLoading(false)
      return
    }

    setArticles((data || []) as KnowledgeArticleRow[])
    setLoading(false)
  })

  const loadSearchResults = useEffectEvent(async (query: string) => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)

    const { data, error: searchError } = await supabase.rpc('search_scotland_knowledge', {
      search_query: trimmedQuery,
      match_limit: 24,
    })

    if (searchError) {
      setError(searchError.message)
      setSearchLoading(false)
      return
    }

    setSearchResults((data || []) as KnowledgeSearchRow[])
    setSearchLoading(false)
  })

  useEffect(() => {
    let cancelled = false

    async function bootstrapAuth() {
      try {
        const user = await getSessionUser()

        if (cancelled) return

        if (!user) {
          router.replace('/login')
          setAuthLoading(false)
          return
        }

        setOperator({
          authUser: user,
          profile: null,
        })
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : 'Unable to load operator session.')
          setAuthLoading(false)
        }
      }
    }

    bootstrapAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        setOperator(null)
        setAuthLoading(false)
        router.replace('/login')
        return
      }

      try {
        const user = session.user
        if (!cancelled) {
          setOperator({
            authUser: user,
            profile: null,
          })
        }
        setAuthLoading(false)
        void hydrateOperatorProfile(user.id)
      } catch (authError) {
        if (!cancelled) {
          setError(authError instanceof Error ? authError.message : 'Unable to refresh operator session.')
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false)
        }
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  useEffect(() => {
    if (!operator?.authUser?.id) return
    void loadArticles()
  }, [operator?.authUser?.id])

  useEffect(() => {
    if (!operator?.authUser?.id) return

    const trimmedQuery = search.trim()

    if (!trimmedQuery) {
      setSearchResults(null)
      setSearchLoading(false)
      return
    }

    const timeoutId = window.setTimeout(() => {
      void loadSearchResults(trimmedQuery)
    }, 220)

    return () => window.clearTimeout(timeoutId)
  }, [operator?.authUser?.id, search])

  const categories = useMemo(() => {
    return Array.from(new Set(articles.map((item) => item.category))).sort((left, right) =>
      left.localeCompare(right)
    )
  }, [articles])

  const rankedArticles = useMemo(() => {
    if (!searchResults) return articles

    const articleLookup = new Map(articles.map((article) => [article.id, article]))
    const seen = new Set<string>()

    return searchResults
      .map((result) => articleLookup.get(result.article_id))
      .filter((article): article is KnowledgeArticleRow => {
        if (!article || seen.has(article.id)) return false
        seen.add(article.id)
        return true
      })
  }, [articles, searchResults])

  const filteredArticles = useMemo(() => {
    return rankedArticles.filter((article) => {
      return categoryFilter === 'all' || article.category === categoryFilter
    })
  }, [categoryFilter, rankedArticles])

  const snippetsByArticleId = useMemo(() => {
    const snippets = new Map<string, string>()

    if (!searchResults) return snippets

    for (const result of searchResults) {
      if (!snippets.has(result.article_id) && result.snippet) {
        snippets.set(result.article_id, result.snippet)
      }
    }

    return snippets
  }, [searchResults])

  const approvedOfficialCount = useMemo(
    () => articles.filter((article) => article.source_authority === 'official').length,
    [articles]
  )

  if (authLoading) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Loading operator session...
          </div>
        </div>
      </main>
    )
  }

  if (!operator?.authUser) {
    return (
      <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
        <div className="mx-auto max-w-4xl">
          <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
            Redirecting to sign in...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1520px]">
        <section className="app-surface-strong rounded-[2rem] p-6 md:p-8">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Back to queue
                </Link>
                <Link
                  href="/calls"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Open calls inbox
                </Link>
                <Link
                  href="/records"
                  className="app-secondary-button inline-flex items-center rounded-full px-4 py-2 text-sm font-medium"
                >
                  Records workspace
                </Link>
              </div>

              <p className="app-kicker mt-6">Scotland Knowledge Base</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                Give Annabelle approved Scotland-specific answers first
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
                This is the starting layer for Annabelle’s legal and FAQ grounding: approved
                official Scotland sources, operator-readable summaries, and a structure we can
                query later for retrieval instead of guessing.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    label: 'Approved articles',
                    value: articles.length,
                    tone: 'border-stone-200 bg-stone-50 text-stone-900',
                  },
                  {
                    label: 'Official sources',
                    value: approvedOfficialCount,
                    tone: 'border-sky-200 bg-sky-50 text-sky-900',
                  },
                  {
                    label: 'Scotland focus',
                    value: articles.filter((article) => article.jurisdiction === 'scotland').length,
                    tone: 'border-emerald-200 bg-emerald-50 text-emerald-900',
                  },
                  {
                    label: 'Visible now',
                    value: filteredArticles.length,
                    tone: 'border-amber-200 bg-amber-50 text-amber-900',
                  },
                ].map((card) => (
                  <article key={card.label} className={`rounded-[1.6rem] border p-4 shadow-sm ${card.tone}`}>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                      {card.label}
                    </div>
                    <div className="mt-3 text-3xl font-semibold">{card.value}</div>
                  </article>
                ))}
              </div>
            </div>

            <aside className="app-surface rounded-[1.8rem] p-5">
              <p className="app-kicker">Operator</p>
              <h2 className="mt-2 text-xl font-semibold">{getOperatorLabel(operator)}</h2>
              <p className="mt-1 text-sm text-stone-600">
                Keep Annabelle grounded in reviewed Scotland material before expanding into wider UK
                property knowledge.
              </p>

              <div className="app-card-muted mt-5 rounded-[1.4rem] p-4">
                <p className="text-sm font-medium text-stone-900">Ground rules</p>
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  <li>Use official Scotland sources first.</li>
                  <li>Hand off case-specific legal advice instead of improvising.</li>
                  <li>Review changes before Annabelle relies on updated law summaries.</li>
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section className="app-surface mt-6 rounded-[2rem] p-5 md:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="app-kicker">Knowledge Controls</p>
                <h2 className="mt-2 text-2xl font-semibold">Filter the approved Scotland material</h2>
              </div>
              <div className="app-card-muted rounded-full px-4 py-2 text-sm text-stone-600">
                {filteredArticles.length} shown of {articles.length} approved
              </div>
            </div>

            <div className="flex flex-wrap gap-2" aria-label="Knowledge categories">
              <button
                onClick={() => setCategoryFilter('all')}
                aria-pressed={categoryFilter === 'all'}
                className={`rounded-full px-4 py-2.5 text-sm font-medium ${
                  categoryFilter === 'all' ? 'app-pill-active' : 'app-pill'
                }`}
              >
                All topics
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  aria-pressed={categoryFilter === category}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium ${
                    categoryFilter === category ? 'app-pill-active' : 'app-pill'
                  }`}
                >
                  {formatCategoryLabel(category)}
                </button>
              ))}
            </div>

            <label className="block max-w-xl">
              <span className="mb-2 block text-sm font-medium text-stone-700">Search Scotland knowledge</span>
              <input
                type="text"
                placeholder="Search by tenancy, deposit, repairs, rent increase, eviction, or keyword"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="app-field text-sm outline-none"
              />
            </label>

            {search.trim() && (
              <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                  Database-ranked Scotland search
                </span>
                {searchLoading ? <span>Searching official Scotland guidance...</span> : null}
              </div>
            )}
          </div>
        </section>

        {(loading || searchLoading) && !articles.length && (
          <div className="app-surface mt-6 rounded-[1.8rem] p-6 text-sm text-stone-600">
            Loading Scotland knowledge...
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-[1.8rem] border border-red-200 bg-red-50/95 p-6 text-sm text-red-700">
            Error: {error}
          </div>
        )}

        {!loading && !error && (
          <section className="mt-6 grid gap-4">
            {filteredArticles.length === 0 && (
              <div className="app-empty-state rounded-[1.8rem] p-6 text-sm">
                No approved Scotland knowledge matches the current filters yet.
              </div>
            )}

            {filteredArticles.map((article) => (
              <article key={article.id} className="app-surface rounded-[1.8rem] p-5 md:p-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getAuthorityTone(article.source_authority)}`}>
                        {article.source_authority}
                      </span>
                      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getReviewTone(article.review_status)}`}>
                        {article.review_status}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                        {article.jurisdiction}
                      </span>
                      <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700">
                        {formatCategoryLabel(article.category)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">{article.title}</h3>
                    {search.trim() && snippetsByArticleId.get(article.id) ? (
                      <div className="mt-4 rounded-[1.3rem] border border-sky-200 bg-sky-50/80 p-4">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                          Best matched excerpt
                        </div>
                        <p className="mt-2 text-sm leading-7 text-sky-950">
                          {snippetsByArticleId.get(article.id)}
                        </p>
                      </div>
                    ) : null}

                    <p className="mt-4 max-w-5xl text-sm leading-7 text-stone-700">{article.content}</p>

                    {article.keywords && article.keywords.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.keywords.map((keyword) => (
                          <span
                            key={`${article.id}-${keyword}`}
                            className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-700"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="w-full max-w-[320px] space-y-3 rounded-[1.5rem] border border-stone-200 bg-stone-50/90 p-4">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Source updated
                      </div>
                      <div className="mt-1 text-sm font-medium text-stone-900">
                        {formatLongDate(article.source_updated_at)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Effective from
                      </div>
                      <div className="mt-1 text-sm font-medium text-stone-900">
                        {formatLongDate(article.effective_from)}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Audience
                      </div>
                      <div className="mt-1 text-sm font-medium text-stone-900">
                        {article.audience?.length ? article.audience.join(', ') : 'Not set'}
                      </div>
                    </div>

                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="app-primary-button inline-flex w-full items-center justify-center rounded-[1.4rem] px-4 py-3 text-sm font-medium"
                      >
                        Open official source
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
