'use client'

import { memo, useCallback, useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  Scale,
  Sparkles,
  X,
} from 'lucide-react'
import { cn } from '@/lib/ui'
import { StatusBadge, formatCurrency } from '@/app/eot/_components/eot-ui'
import type { WorkspaceDefect } from '@/lib/mock/report-fixtures'

/* ── Confidence indicator ─────────────────────────────────────── */

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const tone =
    confidence >= 85
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : confidence >= 70
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-rose-700 bg-rose-50 border-rose-200'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold',
        tone,
      )}
    >
      <Sparkles className="h-2.5 w-2.5" />
      {confidence}%
    </span>
  )
}

/* ── Liability selector ───────────────────────────────────────── */

const LIABILITY_OPTIONS: Array<{ value: WorkspaceDefect['aiLiability']; label: string }> = [
  { value: 'tenant', label: 'Tenant' },
  { value: 'shared', label: 'Shared' },
  { value: 'landlord', label: 'Landlord' },
]

function LiabilitySelector({
  aiLiability,
  operatorLiability,
  onSelect,
}: {
  aiLiability: WorkspaceDefect['aiLiability']
  operatorLiability: WorkspaceDefect['operatorLiability']
  onSelect: (value: WorkspaceDefect['aiLiability']) => void
}) {

  const effective = operatorLiability ?? aiLiability
  const isOverridden = operatorLiability !== null && operatorLiability !== aiLiability

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-zinc-400" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
          Liability
        </span>
        {isOverridden && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
            Overridden
          </span>
        )}
      </div>
      <div className="flex gap-1">
        {LIABILITY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              'flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition',
              effective === opt.value
                ? opt.value === 'tenant'
                  ? 'border-rose-300 bg-rose-50 text-rose-700'
                  : opt.value === 'shared'
                    ? 'border-amber-300 bg-amber-50 text-amber-700'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {isOverridden && (
        <p className="text-[10px] text-amber-600">
          AI suggested: {aiLiability}
        </p>
      )}
    </div>
  )
}

/* ── Cost editor ──────────────────────────────────────────────── */

function CostDisplay({
  estimated,
  adjusted,
  onAdjust,
}: {
  estimated: number
  adjusted: number | null
  onAdjust: (value: number | null) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(String(adjusted ?? estimated))

  const effective = adjusted ?? estimated
  const isAdjusted = adjusted !== null && adjusted !== estimated

  function handleSave() {
    const parsed = parseFloat(editValue)
    if (Number.isFinite(parsed) && parsed >= 0) {
      onAdjust(parsed === estimated ? null : parsed)
    }
    setEditing(false)
  }

  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
        Estimated Cost
      </p>
      {editing ? (
        <div className="mt-1 flex items-center gap-1">
          <span className="text-sm text-zinc-500">£</span>
          <input
            type="number"
            min={0}
            step={5}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setEditing(false)
            }}
            aria-label="Adjusted cost in pounds"
            className="h-7 w-20 rounded border border-zinc-300 px-2 text-sm tabular-nums text-zinc-900 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
            autoFocus
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setEditValue(String(effective))
            setEditing(true)
          }}
          className="mt-1 text-lg font-bold tabular-nums text-zinc-900 hover:text-emerald-700"
          title="Click to adjust"
        >
          {formatCurrency(effective)}
          {isAdjusted && (
            <span className="ml-1.5 text-[10px] font-medium text-amber-600 line-through">
              {formatCurrency(estimated)}
            </span>
          )}
        </button>
      )}
    </div>
  )
}

/* ── Defect review card (memoized) ───────────────────────────── */

type DefectCardProps = {
  defect: WorkspaceDefect
  onLiabilityChange: (id: string, liability: WorkspaceDefect['aiLiability']) => void
  onCostAdjust: (id: string, cost: number | null) => void
  onToggleExclude: (id: string) => void
  onMarkReviewed: (id: string) => void
}

export const DefectReviewCard = memo(function DefectReviewCard({
  defect,
  onLiabilityChange,
  onCostAdjust,
  onToggleExclude,
  onMarkReviewed,
}: DefectCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className={cn(
        'stat-card transition-all',
        defect.excluded && 'opacity-50',
        defect.reviewed && 'border-emerald-200',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[13px] font-semibold text-zinc-900">
              {defect.title}
            </h4>
            <StatusBadge label={defect.type} tone={defect.type === 'damage' ? 'high' : defect.type === 'cleaning' ? 'medium' : 'low'} />
            <StatusBadge label={defect.severity} tone={defect.severity} />
            <ConfidenceBadge confidence={defect.aiConfidence} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {defect.room} &bull; Evidence: {defect.evidenceQuality}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {defect.reviewed ? (
            <span className="flex h-6 items-center gap-1 rounded-md bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700">
              <Check className="h-3 w-3" />
              Reviewed
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onMarkReviewed(defect.id)}
              className="flex h-7 items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-50"
            >
              <Check className="h-3 w-3" />
              Mark Reviewed
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
          {/* Description */}
          <p className="text-[13px] leading-relaxed text-zinc-700">
            {defect.description}
          </p>

          {/* Condition comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
                Check-in
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {defect.checkinCondition}
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
                Check-out
              </p>
              <p className="mt-0.5 text-sm font-medium text-zinc-900">
                {defect.checkoutCondition}
              </p>
            </div>
          </div>

          {/* AI rationale */}
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <Sparkles className="h-3 w-3" />
              AI Rationale
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-emerald-900/80">
              {defect.rationale}
            </p>
            {defect.expectedLifespan && defect.ageAtCheckout !== null && (
              <p className="mt-2 text-[11px] text-emerald-700">
                Expected lifespan: {defect.expectedLifespan}yr &bull; Age at checkout: {defect.ageAtCheckout}yr
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="grid gap-4 sm:grid-cols-3">
            <LiabilitySelector
              aiLiability={defect.aiLiability}
              operatorLiability={defect.operatorLiability}
              onSelect={(v) => onLiabilityChange(defect.id, v)}
            />
            <CostDisplay
              estimated={defect.estimatedCost}
              adjusted={defect.adjustedCost}
              onAdjust={(v) => onCostAdjust(defect.id, v)}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
                Actions
              </p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => onToggleExclude(defect.id)}
                  className={cn(
                    'flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition',
                    defect.excluded
                      ? 'border-amber-300 bg-amber-50 text-amber-700'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50',
                  )}
                >
                  {defect.excluded ? (
                    <>
                      <Eye className="h-3 w-3" />
                      Include
                    </>
                  ) : (
                    <>
                      <X className="h-3 w-3" />
                      Exclude
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

/* ── Defect summary bar ──────────────────────────────────────── */

export function DefectSummaryBar({
  defects,
}: {
  defects: WorkspaceDefect[]
}) {
  const active = defects.filter((d) => !d.excluded)
  const reviewed = active.filter((d) => d.reviewed).length
  const totalCost = active.reduce((s, d) => s + (d.adjustedCost ?? d.estimatedCost), 0)
  const tenantLiable = active.filter((d) => (d.operatorLiability ?? d.aiLiability) === 'tenant').length
  const sharedLiable = active.filter((d) => (d.operatorLiability ?? d.aiLiability) === 'shared').length
  const landlordLiable = active.filter((d) => (d.operatorLiability ?? d.aiLiability) === 'landlord').length

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-200 bg-white px-4 py-3">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Defects</p>
        <p className="text-sm font-bold tabular-nums text-zinc-900">{active.length}</p>
      </div>
      <div className="h-8 w-px bg-zinc-200" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Reviewed</p>
        <p className="text-sm font-bold tabular-nums text-zinc-900">
          {reviewed}/{active.length}
        </p>
      </div>
      <div className="h-8 w-px bg-zinc-200" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-zinc-400">Total Cost</p>
        <p className="text-sm font-bold tabular-nums text-zinc-900">{formatCurrency(totalCost)}</p>
      </div>
      <div className="h-8 w-px bg-zinc-200" />
      <div className="flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          Tenant: {tenantLiable}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Shared: {sharedLiable}
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Landlord: {landlordLiable}
        </span>
      </div>
    </div>
  )
}
