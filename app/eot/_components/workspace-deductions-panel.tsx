'use client'

import { useState } from 'react'
import {
  Check,
  Copy,
  Edit3,
  FileText,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'

/* ── Mock deduction letter ────────────────────────────────────── */

const MOCK_LETTER_SECTIONS = [
  {
    id: 'opening',
    title: 'Opening',
    content:
      'Dear Ms Campbell,\n\nFurther to the end of your tenancy at 17 Bruntsfield Place, Edinburgh EH10 4HN, we have now completed our review of the check-out inspection report and supporting evidence.',
  },
  {
    id: 'deductions',
    title: 'Proposed Deductions',
    content:
      'Following a comparison of the check-in and check-out inventory reports, we have identified the following items where the condition at check-out falls below the standard recorded at the start of the tenancy:\n\n1. Carpet staining in living room — £320\n2. Kitchen deep clean required — £180\n3. Bedroom wall marks and scuffs (shared liability) — £60\n4. Missing window blind — £45\n5. Garden maintenance — £150\n\nTotal proposed deductions: £755',
  },
  {
    id: 'rationale',
    title: 'Rationale',
    content:
      'Each deduction has been assessed against the tenancy agreement terms, fair wear and tear guidelines, and the age/condition of the item at the start of the tenancy. Items where the condition change is consistent with normal use have been excluded.',
  },
  {
    id: 'response',
    title: 'Your Right to Respond',
    content:
      'You have 14 days from receipt of this letter to respond with any comments or additional evidence. If we do not receive a response within this period, we will proceed with the proposed deductions from your deposit.',
  },
  {
    id: 'closing',
    title: 'Closing',
    content:
      'If you have any questions, please contact us at your earliest convenience.\n\nYours sincerely,\nRenovo AI — Property Management',
  },
]

/* ── Letter section editor ────────────────────────────────────── */

function LetterSection({
  section,
  onEdit,
}: {
  section: (typeof MOCK_LETTER_SECTIONS)[number]
  onEdit: (id: string, content: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(section.content)

  function handleSave() {
    onEdit(section.id, editContent)
    setEditing(false)
  }

  return (
    <div className="border-b border-zinc-100 py-4 last:border-b-0">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
          {section.title}
        </h4>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <Edit3 className="h-2.5 w-2.5" />
            Edit
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={6}
            aria-label={`Edit ${section.title} section`}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-7 items-center gap-1 rounded-lg bg-zinc-900 px-3 text-[11px] font-medium text-white hover:bg-zinc-800"
            >
              <Check className="h-3 w-3" />
              Save
            </button>
            <button
              type="button"
              onClick={() => { setEditContent(section.content); setEditing(false) }}
              className="inline-flex h-7 items-center rounded-lg border border-zinc-200 px-3 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-zinc-700">
          {section.content}
        </p>
      )}
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

export function WorkspaceDeductionsPanel() {
  const [sections, setSections] = useState(MOCK_LETTER_SECTIONS)
  const [sent, setSent] = useState(false)

  function handleEdit(id: string, content: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s)),
    )
  }

  function handleCopyAll() {
    const fullText = sections.map((s) => s.content).join('\n\n')
    navigator.clipboard.writeText(fullText).catch(() => {})
  }

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-400" />
          <span className="text-[13px] font-semibold text-zinc-900">
            Deduction Letter Draft
          </span>
        </div>
        <div className="h-6 w-px bg-zinc-200" />
        <span className="text-xs text-zinc-500">
          Total deductions: <strong className="font-semibold text-zinc-900">{formatCurrency(755)}</strong>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
          >
            <Copy className="h-3 w-3" />
            Copy All
          </button>
          <button
            type="button"
            onClick={() => setSent(true)}
            disabled={sent}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[11px] font-semibold transition',
              sent
                ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800',
            )}
          >
            {sent ? (
              <>
                <Check className="h-3 w-3" />
                Sent to Tenant
              </>
            ) : (
              <>
                <Send className="h-3 w-3" />
                Send to Tenant
              </>
            )}
          </button>
        </div>
      </div>

      {/* Letter content */}
      <div className="stat-card">
        {sections.map((section) => (
          <LetterSection
            key={section.id}
            section={section}
            onEdit={handleEdit}
          />
        ))}
      </div>
    </div>
  )
}
