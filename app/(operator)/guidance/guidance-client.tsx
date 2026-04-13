'use client'

import { useState } from 'react'
import { cn } from '@/lib/ui'

const ARTICLES = [
  { title: 'Fair wear and tear', category: 'Dispute Handling', region: 'All', summary: 'Normal deterioration from reasonable use should not be treated as tenant-caused damage.' },
  { title: 'Cleaning standards at checkout', category: 'Evidence Standards', region: 'All', summary: 'Acceptable cleanliness depends on the condition at check-in and tenancy length.' },
  { title: 'Deposit deduction timelines', category: 'Compliance', region: 'England', summary: 'Landlords must return deposits within 10 days of agreement.' },
  { title: 'Photography as evidence', category: 'Evidence Standards', region: 'All', summary: 'Dated, well-lit photographs comparing check-in and checkout are the strongest evidence.' },
  { title: 'Betterment and improvement', category: 'Dispute Handling', region: 'Scotland', summary: 'Landlords cannot claim for improvements beyond the original condition.' },
  { title: 'Pre-tenancy condition reports', category: 'Evidence Standards', region: 'All', summary: 'A thorough check-in report is the foundation of every deposit claim.' },
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

  let filtered = ARTICLES
  if (category !== 'All Categories') filtered = filtered.filter((a) => a.category === category)
  if (region !== 'All') filtered = filtered.filter((a) => a.region === 'All' || a.region === region)
  if (search) {
    const q = search.toLowerCase()
    filtered = filtered.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Guidance</h2>
          <p className="mt-1 text-[13px] text-zinc-500">{filtered.length} knowledge articles</p>
        </div>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-[220px] rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
              category === c
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            )}
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
            className={cn(
              'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
              region === r
                ? 'bg-zinc-900 text-white'
                : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
            )}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Article grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((article) => (
            <div key={article.title} className="rounded-[10px] border border-zinc-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h4 className="text-sm font-semibold text-zinc-900">{article.title}</h4>
                <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600">
                  {article.region}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-zinc-500">{article.summary}</p>
              <div className="mt-3">
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {article.category}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[10px] border border-zinc-200 bg-white px-4 py-10 text-center text-[13px] text-zinc-500">
          No articles match your filters
        </div>
      )}
    </div>
  )
}
