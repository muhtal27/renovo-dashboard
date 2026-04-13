'use client'

import { useState } from 'react'
import { cn } from '@/lib/ui'

type InventoryReturn = {
  id: string
  property: string
  tenant: string
  returnDate: string | null
  status: 'signed' | 'pending' | 'flagged'
  conditionScore: string | null
  rooms: number
  signedDate: string | null
  remarks: string | null
  roomNotes: Array<{ room: string; note: string }>
}

const INVENTORY_RETURNS: InventoryReturn[] = [
  { id: 'INV-001', property: '17 Bruntsfield Place, Edinburgh EH1 4EQ', tenant: 'Sarah Campbell', returnDate: '10 Apr 2026', status: 'signed', conditionScore: 'Good', rooms: 5, signedDate: '10 Apr 2026', remarks: 'All items accounted for. Noted small mark on bedroom wall near window, appears to be from furniture. Otherwise in excellent condition.', roomNotes: [{ room: 'Living Room', note: 'Good condition, minor wear on carpet near doorway' }, { room: 'Kitchen', note: 'Clean, all appliances working' }, { room: 'Master Bedroom', note: 'Small mark on wall near window from wardrobe' }, { room: 'Bathroom', note: 'Grout slightly discoloured, otherwise good' }, { room: 'Hallway', note: 'No issues noted' }] },
  { id: 'INV-002', property: '42 Leith Walk, Edinburgh EH6 5HB', tenant: 'James Murray', returnDate: '8 Apr 2026', status: 'flagged', conditionScore: 'Fair', rooms: 4, signedDate: null, remarks: 'Tenant has disputed condition of hallway walls and carpet stain in bedroom. Refuses to sign until marks are reviewed against check-in report.', roomNotes: [{ room: 'Living Room', note: 'Acceptable condition' }, { room: 'Kitchen', note: 'Oven requires deep clean' }, { room: 'Bedroom', note: 'Red wine stain on carpet, not in check-in report' }, { room: 'Hallway', note: 'Multiple scuff marks on walls' }] },
  { id: 'INV-003', property: '8 Morningside Road, Edinburgh EH10 4DD', tenant: 'Emma Wilson', returnDate: '5 Apr 2026', status: 'signed', conditionScore: 'Good', rooms: 6, signedDate: '5 Apr 2026', remarks: 'Property returned in very good condition. Tenant noted pre-existing crack in bathroom tile which was confirmed in check-in report.', roomNotes: [{ room: 'Living Room', note: 'Excellent condition' }, { room: 'Kitchen', note: 'Clean and tidy' }, { room: 'Bedroom 1', note: 'No issues' }, { room: 'Bedroom 2', note: 'No issues' }, { room: 'Bathroom', note: 'Pre-existing tile crack confirmed' }, { room: 'Garden', note: 'Well maintained' }] },
  { id: 'INV-004', property: '91 Gorgie Road, Edinburgh EH11 2LA', tenant: 'Omar Rashid', returnDate: null, status: 'pending', conditionScore: null, rooms: 3, signedDate: null, remarks: null, roomNotes: [] },
  { id: 'INV-005', property: '23 Dalry Road, Edinburgh EH11 2BQ', tenant: 'Rachel Stewart', returnDate: '1 Apr 2026', status: 'signed', conditionScore: 'Good', rooms: 4, signedDate: '1 Apr 2026', remarks: 'Clean return. Tenant noted one missing curtain hook in living room which was replaced at no cost.', roomNotes: [{ room: 'Living Room', note: 'Missing curtain hook, replaced' }, { room: 'Kitchen', note: 'Good condition' }, { room: 'Bedroom', note: 'No issues' }, { room: 'Bathroom', note: 'Clean' }] },
  { id: 'INV-006', property: '156 Causewayside, Edinburgh EH9 1PN', tenant: "Liam O'Brien", returnDate: '28 Mar 2026', status: 'flagged', conditionScore: 'Poor', rooms: 4, signedDate: null, remarks: 'Multiple issues identified. Tenant disagrees with garden maintenance charges and condition of kitchen appliances. Escalated to dispute.', roomNotes: [{ room: 'Living Room', note: 'Smoke damage to ceiling' }, { room: 'Kitchen', note: 'Oven and hob heavily soiled, extractor fan broken' }, { room: 'Bedroom', note: 'Carpet staining throughout' }, { room: 'Garden', note: 'Severely overgrown, fence panel damaged' }] },
  { id: 'INV-007', property: '3 Dean Path, Edinburgh EH4 3BA', tenant: 'Priya Sharma', returnDate: '20 Mar 2026', status: 'signed', conditionScore: 'Good', rooms: 5, signedDate: '20 Mar 2026', remarks: 'Excellent return. Property in better condition than check-in. No deductions recommended.', roomNotes: [{ room: 'Living Room', note: 'Excellent' }, { room: 'Kitchen', note: 'Spotless' }, { room: 'Bedroom 1', note: 'Very good' }, { room: 'Bedroom 2', note: 'Very good' }, { room: 'Bathroom', note: 'Excellent' }] },
  { id: 'INV-008', property: '67 Easter Road, Edinburgh EH7 5PW', tenant: 'Tom Henderson', returnDate: null, status: 'pending', conditionScore: null, rooms: 3, signedDate: null, remarks: null, roomNotes: [] },
]

const STATUS_BADGE: Record<string, string> = {
  signed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  flagged: 'border-rose-200 bg-rose-50 text-rose-700',
}

const CONDITION_BADGE: Record<string, string> = {
  Good: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  Fair: 'border-amber-200 bg-amber-50 text-amber-700',
  Poor: 'border-rose-200 bg-rose-50 text-rose-700',
}

export function InventoryFeedbackClient() {
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const signed = INVENTORY_RETURNS.filter((i) => i.status === 'signed').length
  const pending = INVENTORY_RETURNS.filter((i) => i.status === 'pending').length
  const flagged = INVENTORY_RETURNS.filter((i) => i.status === 'flagged').length

  let items = INVENTORY_RETURNS
  if (statusFilter !== 'all') items = items.filter((i) => i.status === statusFilter)
  if (search) {
    const q = search.toLowerCase()
    items = items.filter(
      (i) => i.property.toLowerCase().includes(q) || i.tenant.toLowerCase().includes(q)
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Inventory Feedback</h2>
        <p className="mt-1 text-[13px] text-zinc-500">Returned signed inventories and tenant remarks</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Returns', value: INVENTORY_RETURNS.length, color: 'text-zinc-900' },
          { label: 'Signed', value: signed, color: 'text-emerald-700' },
          { label: 'Pending', value: pending, color: 'text-amber-700' },
          { label: 'Flagged', value: flagged, color: 'text-rose-700' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[10px] border border-zinc-200 bg-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              {stat.label}
            </div>
            <div className={cn('mt-1 text-2xl font-bold tabular-nums', stat.color)}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'signed', label: `Signed (${signed})` },
            { key: 'pending', label: `Pending (${pending})` },
            { key: 'flagged', label: `Flagged (${flagged})` },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-[13px] font-medium transition',
                statusFilter === f.key
                  ? 'bg-zinc-900 text-white'
                  : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search property or tenant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-auto h-[34px] w-[200px] rounded-[10px] border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none transition focus:border-emerald-400 focus:ring-[3px] focus:ring-emerald-500/10"
        />
      </div>

      {/* Inventory list */}
      <div className="space-y-4">
        {items.map((inv) => {
          const expanded = expandedId === inv.id
          const shortProperty = inv.property.split(',')[0]

          return (
            <div
              key={inv.id}
              className={cn(
                'overflow-hidden rounded-[10px] border border-zinc-200 bg-white',
                inv.status === 'flagged' && 'border-l-[3px] border-l-rose-500'
              )}
            >
              {/* Row header */}
              <button
                type="button"
                onClick={() => setExpandedId(expanded ? null : inv.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{shortProperty}</span>
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                        STATUS_BADGE[inv.status]
                      )}
                    >
                      {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-zinc-500">
                    {inv.tenant} &middot; {inv.id}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Condition
                    </div>
                    <div className="mt-1">
                      {inv.conditionScore ? (
                        <span
                          className={cn(
                            'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                            CONDITION_BADGE[inv.conditionScore] ?? 'bg-zinc-100 text-zinc-600'
                          )}
                        >
                          {inv.conditionScore}
                        </span>
                      ) : (
                        <span className="text-[11px] text-zinc-400">Awaiting</span>
                      )}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Rooms
                    </div>
                    <div className="mt-1 text-[13px] font-semibold text-zinc-900">{inv.rooms}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                      Returned
                    </div>
                    <div className="mt-1 text-[13px] text-zinc-700">{inv.returnDate ?? '—'}</div>
                  </div>
                  <svg
                    className={cn('h-4 w-4 text-zinc-400 transition', expanded && 'rotate-180')}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </button>

              {/* Expanded detail */}
              {expanded && (
                <div className="border-t border-zinc-100 bg-zinc-50 px-5 py-5">
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* Tenant Remarks */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-zinc-900">Tenant Remarks</h4>
                      {inv.remarks ? (
                        <div className="rounded-[6px] border border-zinc-200 bg-white px-3.5 py-3 text-[13px] leading-relaxed text-zinc-700">
                          {inv.remarks}
                        </div>
                      ) : (
                        <p className="text-[13px] text-zinc-500">No remarks yet — inventory not returned.</p>
                      )}
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                          Signature
                        </span>
                        {inv.signedDate ? (
                          <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
                            </svg>
                            Signed {inv.signedDate}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 6v6l4 2" />
                            </svg>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Room-by-Room Notes */}
                    <div>
                      <h4 className="mb-3 text-sm font-semibold text-zinc-900">Room-by-Room Notes</h4>
                      {inv.roomNotes.length > 0 ? (
                        <div className="space-y-2">
                          {inv.roomNotes.map((r) => (
                            <div key={r.room} className="rounded-[6px] border border-zinc-200 bg-white px-3.5 py-2.5">
                              <div className="text-xs font-semibold text-zinc-900">{r.room}</div>
                              <div className="mt-0.5 text-xs text-zinc-600">{r.note}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[13px] text-zinc-500">No room notes available yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15V3m0 12-5-5m5 5 5-5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      </svg>
                      Download Report
                    </button>
                    {inv.status === 'flagged' && (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-[10px] bg-rose-50 px-3 py-1.5 text-[13px] font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4M12 17h.01" />
                        </svg>
                        View Dispute
                      </button>
                    )}
                    {inv.status === 'pending' && (
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-[10px] bg-emerald-500 px-3 py-1.5 text-[13px] font-medium text-white transition hover:bg-emerald-600"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21.854 2.147-10.94 10.939" />
                        </svg>
                        Send Reminder
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
