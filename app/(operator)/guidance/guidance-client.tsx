'use client'

import { ArrowRight, BookOpen, ChevronRight, Copy, FileText, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/ui'

type Article = {
  title: string
  category: string
  region: string
  summary: string
  content?: string[]
  related?: string[]
}

const ARTICLES: Article[] = [
  { title: 'Fair wear and tear', category: 'Dispute Handling', region: 'All', summary: 'Normal deterioration from reasonable use should not be treated as tenant-caused damage.', content: ['Fair wear and tear refers to the reasonable use of a premises by a tenant and the natural operation of time.', 'Items such as carpet wear in high-traffic areas, minor scuffs on walls, and faded curtains from sunlight are typical examples.', 'Landlords cannot deduct for fair wear and tear. The assessment should compare the condition at check-in with the condition at checkout, accounting for the length of tenancy.', 'Deposit schemes consistently rule against landlords who attempt to claim for normal deterioration.'], related: ['Cleaning standards at checkout', 'Repainting and redecoration'] },
  { title: 'Cleaning standards at checkout', category: 'Evidence Standards', region: 'All', summary: 'Acceptable cleanliness depends on the condition at check-in and tenancy length.', content: ['The property should be returned in a similar level of cleanliness to when the tenancy began.', 'If the property was not professionally cleaned at the start of the tenancy, a professional clean cannot be required at the end.', 'Photographic evidence of the cleaning standard at check-in is essential for supporting any cleaning deduction claims.'], related: ['Fair wear and tear', 'Professional cleaning charges'] },
  { title: 'Deposit deduction timelines', category: 'Compliance', region: 'England', summary: 'Landlords must return deposits within 10 days of agreement.', content: ['Under UK law, deposits must be returned within 10 days of both parties agreeing on the amount.', 'If there is a dispute, the deposit scheme will hold the disputed amount until adjudication is complete.', 'Landlords who fail to protect deposits or return them on time may face penalties of up to 3x the deposit amount.'], related: ['Scottish deposit return rules', 'Northern Ireland deposit rules'] },
  { title: 'Photography as evidence', category: 'Evidence Standards', region: 'All', summary: 'Dated, well-lit photographs comparing check-in and checkout are the strongest evidence.', content: ['Photographs should be timestamped and taken in good lighting conditions.', 'Both wide-angle room shots and close-up detail shots should be captured.', 'Side-by-side comparison of check-in vs checkout photos is the most effective evidence in adjudication.'], related: ['Check-in report standards', 'Dispute evidence bundles'] },
  { title: 'Betterment and improvement', category: 'Dispute Handling', region: 'Scotland', summary: 'Landlords cannot claim for improvements beyond the original condition.', content: ['Betterment occurs when a landlord attempts to charge the tenant for improvements that go beyond restoring the property to its original condition.', 'If a carpet was 5 years old at check-in and damaged during tenancy, the landlord can only claim the depreciated value, not the cost of a new carpet.', 'Deposit schemes will reject claims that include an element of betterment.'], related: ['Fair wear and tear', 'Appliance wear expectations'] },
  { title: 'Pre-tenancy condition reports', category: 'Evidence Standards', region: 'All', summary: 'A thorough check-in report is the foundation of every deposit claim.', content: ['A comprehensive check-in inventory should document the condition of every room, fixture and fitting.', 'Reports should be signed by both landlord/agent and tenant to confirm agreement.', 'The absence of a detailed check-in report significantly weakens any deposit deduction claim.'] },
  { title: 'Scottish deposit return rules', category: 'Compliance', region: 'Scotland', summary: 'Deposits must be returned within 30 working days or within 5 days of agreement.' },
  { title: 'England fixed-term AST rules', category: 'Compliance', region: 'England', summary: 'Section 21 notices and deposit protection requirements for assured shorthold tenancies.' },
  { title: 'Wales Renting Homes Act', category: 'Compliance', region: 'Wales', summary: 'Occupation contracts replaced ASTs under the Renting Homes (Wales) Act 2016.' },
  { title: 'Northern Ireland deposit rules', category: 'Compliance', region: 'N. Ireland', summary: 'Tenancy Deposit Scheme NI covers all private residential tenancies.' },
  { title: 'Check-in report standards', category: 'Evidence Standards', region: 'All', summary: 'Best practices for creating comprehensive move-in inventories.' },
  { title: 'Deduction communication best practices', category: 'Dispute Handling', region: 'All', summary: 'Clear, itemised communication reduces dispute rates by up to 40%.' },
  { title: 'Appliance wear expectations', category: 'Dispute Handling', region: 'All', summary: 'Lifespan-based depreciation for appliances, fixtures and fittings.' },
  { title: 'Damp and mould responsibility', category: 'Dispute Handling', region: 'All', summary: 'Distinguishing between structural damp and tenant-caused condensation.' },
  { title: 'Garden maintenance standards', category: 'Evidence Standards', region: 'All', summary: 'Expected outdoor maintenance varies by season and tenancy terms.' },
  { title: 'Key and lock replacement', category: 'Dispute Handling', region: 'All', summary: 'Charging for lost keys and security upgrades at checkout.' },
  { title: 'Professional cleaning charges', category: 'Dispute Handling', region: 'All', summary: 'When professional cleaning deductions are justified and proportionate.' },
  { title: 'Repainting and redecoration', category: 'Dispute Handling', region: 'All', summary: 'Wall damage, marks and redecoration costs relative to tenancy length.' },
  { title: 'Furnished vs unfurnished claims', category: 'Dispute Handling', region: 'All', summary: 'How furnishing level affects the scope of deposit deductions.' },
  { title: 'Dealing with abandoned items', category: 'Compliance', region: 'All', summary: 'Legal obligations when tenants leave belongings behind at checkout.' },
  { title: 'Adjudication process overview', category: 'Dispute Handling', region: 'All', summary: 'What to expect during formal deposit dispute adjudication.' },
  { title: 'Scotland HMO deposits', category: 'Compliance', region: 'Scotland', summary: 'Special deposit rules for Houses in Multiple Occupation in Scotland.' },
  { title: 'Utility meter reading guidance', category: 'Evidence Standards', region: 'All', summary: 'Best practices for recording and transferring utility readings at checkout.' },
  { title: 'Inventory comparison techniques', category: 'Evidence Standards', region: 'All', summary: 'Structured comparison methods for check-in vs checkout reports.' },
  { title: 'Dispute evidence bundles', category: 'Evidence Standards', region: 'All', summary: 'How to compile and present evidence for deposit scheme adjudication.' },
]

const CATEGORIES = ['All Categories', 'Dispute Handling', 'Evidence Standards', 'Compliance']
const REGIONS = ['All', 'England', 'Wales', 'Scotland', 'N. Ireland']

export function GuidanceClient() {
  const [category, setCategory] = useState('All Categories')
  const [region, setRegion] = useState('All')
  const [search, setSearch] = useState('')
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  let filtered = ARTICLES as Article[]
  if (category !== 'All Categories') filtered = filtered.filter((a) => a.category === category)
  if (region !== 'All') filtered = filtered.filter((a) => a.region === 'All' || a.region === region)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    )
  }

  const handleClosePanel = useCallback(() => setSelectedArticle(null), [])

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClosePanel()
    }
    if (selectedArticle) {
      window.addEventListener('keydown', handleEsc)
      return () => window.removeEventListener('keydown', handleEsc)
    }
  }, [selectedArticle, handleClosePanel])

  const handleCopySummary = useCallback(() => {
    if (!selectedArticle) return
    void navigator.clipboard.writeText(`${selectedArticle.title}\n\n${selectedArticle.summary}`)
    toast.success('Summary copied to clipboard')
  }, [selectedArticle])

  return (
    <div className="space-y-5 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[24px] font-semibold tracking-tight text-zinc-900">Guidance</h2>
          <p className="mt-1 text-[13px] text-zinc-500">{filtered.length} knowledge articles</p>
        </div>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[220px] rounded-[var(--radius-lg)] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn('pill', category === c && 'active')}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Region pills */}
      <div className="flex flex-wrap gap-2">
        {REGIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRegion(r)}
            className={cn('pill', region === r && 'active')}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Article grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <button
              key={article.title}
              type="button"
              onClick={() => setSelectedArticle(article)}
              className="group rounded-[var(--radius-md)] border border-zinc-200 bg-white p-5 text-left transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-zinc-900">{article.title}</h4>
                <span className="badge badge-zinc shrink-0">{article.region}</span>
              </div>
              <p className="mt-2 text-[13px] text-zinc-500">{article.summary}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="badge badge-emerald">{article.category}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 group-hover:text-emerald-600">
                  Read more <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        // G1 — prototype empty state includes icon + secondary copy.
        <div className="rounded-[var(--radius-md)] border border-zinc-200 bg-white px-4 py-10 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-zinc-300" />
          <p className="mt-3 text-[13px] font-medium text-zinc-700">No articles match your filters</p>
          <p className="mt-1 text-[12px] text-zinc-500">Try adjusting your search or filters.</p>
        </div>
      )}

      {/* Article Detail Panel (slide-in) */}
      {selectedArticle ? (
        <>
          <div
            className="fixed inset-0 z-[55] bg-zinc-950/30"
            onClick={handleClosePanel}
          />
          <aside
            className="fixed inset-y-0 right-0 z-[55] w-full max-w-[640px] overflow-y-auto bg-white shadow-lg animate-slide-in-right"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-4">
              <h3 className="text-base font-semibold text-zinc-900">{selectedArticle.title}</h3>
              <button
                type="button"
                onClick={handleClosePanel}
                className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Meta badges */}
              <div className="flex items-center gap-2">
                <span className="badge badge-emerald">{selectedArticle.category}</span>
                <span className="badge badge-zinc">{selectedArticle.region}</span>
              </div>

              {/* Content */}
              <div className="space-y-3">
                {selectedArticle.content?.length ? (
                  selectedArticle.content.map((para, i) => (
                    <p key={i} className="text-[14px] leading-relaxed text-zinc-700">{para}</p>
                  ))
                ) : (
                  <p className="text-[14px] leading-relaxed text-zinc-700">{selectedArticle.summary}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t border-zinc-100 pt-4">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="app-secondary-button"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy Summary
                </button>
                <button
                  type="button"
                  className="app-secondary-button"
                >
                  <FileText className="h-3.5 w-3.5" />
                  Insert into Notes
                </button>
              </div>

              {/* Related articles */}
              {selectedArticle.related?.length ? (
                <div className="border-t border-zinc-100 pt-4">
                  <h4 className="text-sm font-semibold text-zinc-900">Related Articles</h4>
                  <div className="mt-3 space-y-2">
                    {selectedArticle.related.map((relTitle) => {
                      const relArticle = ARTICLES.find((a) => a.title === relTitle)
                      if (!relArticle) return null
                      return (
                        <button
                          key={relTitle}
                          type="button"
                          onClick={() => setSelectedArticle(relArticle)}
                          className="flex w-full items-center justify-between rounded-[var(--radius-sm)] bg-zinc-50 px-3 py-2.5 text-left transition hover:bg-zinc-100"
                        >
                          <span className="text-[13px] font-medium text-zinc-700">{relTitle}</span>
                          <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  )
}
