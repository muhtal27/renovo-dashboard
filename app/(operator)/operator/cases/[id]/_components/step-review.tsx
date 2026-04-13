'use client'

import { AlertTriangle, Check, ChevronDown, ChevronRight, Eye, EyeOff, Filter, Loader2, Maximize2, RotateCcw, Save, SortAsc, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import { DefectDetailModal } from '@/app/(operator)/operator/cases/[id]/_components/defect-detail-modal'
import {
  ConditionBadge,
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceNotice,
  WorkspaceOptionButton,
  WorkspaceProgressBar,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { AIAssistantPanel } from '@/app/(operator)/operator/cases/[id]/_components/ai-assistant-panel'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import type {
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceLiability,
  CheckoutWorkspaceRoomRecord,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'

/* ------------------------------------------------------------------ */
/*  Local state per defect                                             */
/* ------------------------------------------------------------------ */

type DefectEditState = {
  operatorLiability: CheckoutWorkspaceLiability | null
  costAdjusted: number | null
  excluded: boolean
}

function isDefectExcluded(d: CheckoutWorkspaceDefectRecord): boolean {
  if (!d.reviewedAt) return false
  if (d.costAdjusted !== 0) return false
  if (d.operatorLiability !== null) return false
  return d.costEstimate != null && d.costEstimate > 0
}

function buildInitialEdits(defects: CheckoutWorkspaceDefectRecord[]): Record<string, DefectEditState> {
  const map: Record<string, DefectEditState> = {}
  for (const d of defects) {
    map[d.id] = {
      operatorLiability: d.operatorLiability ?? d.aiSuggestedLiability,
      costAdjusted: d.costAdjusted ?? d.costEstimate,
      excluded: isDefectExcluded(d),
    }
  }
  return map
}

const LIABILITY_OPTIONS: { value: CheckoutWorkspaceLiability; label: string; tone: 'tenant' | 'landlord' | 'shared' }[] = [
  { value: 'tenant', label: 'Tenant', tone: 'tenant' },
  { value: 'landlord', label: 'Landlord', tone: 'landlord' },
  { value: 'shared', label: 'Shared', tone: 'shared' },
]

/* ------------------------------------------------------------------ */
/*  Filter/sort types                                                  */
/* ------------------------------------------------------------------ */

type DefectFilter = 'all' | 'pending' | 'tenant' | 'landlord' | 'shared' | 'excluded'
type DefectSort = 'room' | 'cost-desc' | 'cost-asc' | 'type' | 'confidence'

const FILTER_OPTIONS: { value: DefectFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'shared', label: 'Shared' },
  { value: 'excluded', label: 'Excluded' },
]

const SORT_OPTIONS: { value: DefectSort; label: string }[] = [
  { value: 'room', label: 'By room' },
  { value: 'cost-desc', label: 'Cost (high to low)' },
  { value: 'cost-asc', label: 'Cost (low to high)' },
  { value: 'type', label: 'By type' },
  { value: 'confidence', label: 'AI confidence' },
]

/* ------------------------------------------------------------------ */
/*  Trade filter types                                                 */
/* ------------------------------------------------------------------ */

type TradeFilter = 'all' | 'cleaning' | 'maintenance'

const TRADE_FILTER_OPTIONS: { value: TradeFilter; label: string }[] = [
  { value: 'all', label: 'All Trades' },
  { value: 'cleaning', label: 'Cleaning' },
  { value: 'maintenance', label: 'Maintenance' },
]

/* ------------------------------------------------------------------ */
/*  Liability filter types                                             */
/* ------------------------------------------------------------------ */

type LiabilityFilter = 'all' | 'tenant' | 'landlord' | 'shared'

const LIABILITY_FILTER_OPTIONS: { value: LiabilityFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'landlord', label: 'Landlord' },
  { value: 'shared', label: 'Shared' },
]

/* ------------------------------------------------------------------ */
/*  Severity helpers                                                   */
/* ------------------------------------------------------------------ */

function getDefectSeverity(d: CheckoutWorkspaceDefectRecord): 'high' | 'medium' | 'low' {
  const cost = d.costEstimate ?? 0
  if (cost >= 200) return 'high'
  if (cost >= 50) return 'medium'
  return 'low'
}

function severityBorderColor(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'border-l-rose-500'
  if (severity === 'medium') return 'border-l-amber-500'
  return 'border-l-zinc-400'
}

function severityBadgeTone(severity: 'high' | 'medium' | 'low') {
  if (severity === 'high') return 'bg-rose-50 text-rose-700'
  if (severity === 'medium') return 'bg-amber-50 text-amber-700'
  return 'bg-zinc-100 text-zinc-600'
}

/* ------------------------------------------------------------------ */
/*  Defect queue card (left panel)                                     */
/* ------------------------------------------------------------------ */

function DefectQueueCard({
  defect,
  edit,
  isSelected,
  roomMap,
  onClick,
}: {
  defect: CheckoutWorkspaceDefectRecord
  edit: DefectEditState
  isSelected: boolean
  roomMap: Map<string, CheckoutWorkspaceRoomRecord>
  onClick: () => void
}) {
  const severity = getDefectSeverity(defect)
  const room = roomMap.get(defect.roomId)
  const effectiveCost = edit.excluded ? 0 : (edit.costAdjusted ?? defect.costEstimate ?? 0)
  const isReviewed = edit.operatorLiability !== null && !edit.excluded

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-[6px] border border-zinc-200 bg-white p-3 text-left cursor-pointer border-l-[3px] transition-all',
        isSelected
          ? 'border-l-emerald-500 bg-emerald-50 border-emerald-200'
          : severityBorderColor(severity),
        edit.excluded && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-semibold text-zinc-900 leading-tight">{defect.itemName}</p>
        {isReviewed ? (
          <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-3 w-3 text-white" />
          </span>
        ) : null}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {room ? (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-600">
            {room.roomName}
          </span>
        ) : null}
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', severityBadgeTone(severity))}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </span>
        {edit.operatorLiability ? (
          <span className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium',
            edit.operatorLiability === 'tenant' ? 'bg-fuchsia-50 text-fuchsia-700' :
            edit.operatorLiability === 'landlord' ? 'bg-sky-50 text-sky-700' :
            'bg-orange-50 text-orange-700'
          )}>
            {formatEnumLabel(edit.operatorLiability)}
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[13px] font-semibold tabular-nums text-zinc-900">
          {formatCurrency(effectiveCost)}
        </span>
        {edit.excluded ? (
          <span className="text-[10px] font-medium text-zinc-400">Excluded</span>
        ) : null}
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Defect row (used in grouped list / flat view as fallback)          */
/* ------------------------------------------------------------------ */

function DefectRow({
  defect,
  edit,
  isReview,
  onChange,
  onOpenDetail,
}: {
  defect: CheckoutWorkspaceDefectRecord
  edit: DefectEditState
  isReview: boolean
  onChange: (id: string, patch: Partial<DefectEditState>) => void
  onOpenDetail?: (defectId: string) => void
}) {
  const effectiveCost = edit.excluded ? 0 : (edit.costAdjusted ?? 0)
  const aiLiability = defect.aiSuggestedLiability
  const hasOverride =
    edit.operatorLiability !== null &&
    aiLiability !== null &&
    edit.operatorLiability !== aiLiability
  const hasCostOverride =
    defect.costEstimate !== null &&
    edit.costAdjusted !== null &&
    edit.costAdjusted !== defect.costEstimate

  return (
    <div
      className={cn(
        'rounded-[10px] border border-zinc-200 bg-white px-4 py-4 transition',
        edit.excluded && 'opacity-50'
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-zinc-950">{defect.itemName}</p>
            <WorkspaceBadge
              label={formatEnumLabel(defect.defectType)}
              size="compact"
              tone={defect.defectType === 'cleaning' ? 'cleaning' : 'maintenance'}
            />
            {defect.conditionCurrent ? (
              <ConditionBadge value={defect.conditionCurrent} />
            ) : null}
            {edit.excluded ? (
              <WorkspaceBadge label="Excluded" size="compact" tone="neutral" />
            ) : null}
            {hasOverride ? (
              <WorkspaceBadge label="Override" size="compact" tone="warning" />
            ) : null}
          </div>
          {defect.description ? (
            <p className="mt-1 text-xs leading-5 text-zinc-500">{defect.description}</p>
          ) : null}
          {defect.aiReasoning ? (
            <p className="mt-1 text-[11px] leading-4 text-zinc-400 italic">
              AI: {defect.aiReasoning}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {/* View detail button */}
          {onOpenDetail ? (
            <button
              type="button"
              onClick={() => onOpenDetail(defect.id)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-600"
              title="View details"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          ) : null}

          {/* Exclude toggle */}
          {isReview ? (
            <button
              type="button"
              onClick={() => onChange(defect.id, { excluded: !edit.excluded })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition',
                edit.excluded
                  ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  : 'bg-white text-zinc-500 hover:bg-zinc-50'
              )}
              title={edit.excluded ? 'Include this defect' : 'Exclude this defect'}
            >
              {edit.excluded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {edit.excluded ? 'Include' : 'Exclude'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Editable fields */}
      {!edit.excluded ? (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          {/* Liability toggle */}
          <div className="min-w-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Liability
            </p>
            {isReview ? (
              <div className="flex gap-1">
                {LIABILITY_OPTIONS.map((opt) => (
                  <WorkspaceOptionButton
                    key={opt.value}
                    selected={edit.operatorLiability === opt.value}
                    tone={opt.tone}
                    onClick={() => onChange(defect.id, { operatorLiability: opt.value })}
                    className="px-3 py-1.5 text-xs"
                  >
                    {opt.label}
                  </WorkspaceOptionButton>
                ))}
              </div>
            ) : (
              <span
                className={cn(
                  'text-sm font-medium',
                  edit.operatorLiability === 'tenant'
                    ? 'text-fuchsia-700'
                    : edit.operatorLiability === 'landlord'
                      ? 'text-sky-700'
                      : edit.operatorLiability === 'shared'
                        ? 'text-orange-700'
                        : 'text-zinc-400'
                )}
              >
                {edit.operatorLiability ? formatEnumLabel(edit.operatorLiability) : 'Unassigned'}
              </span>
            )}
            {hasOverride ? (
              <p className="mt-1 text-[10px] text-amber-600">
                AI suggested: {formatEnumLabel(aiLiability!)}
              </p>
            ) : null}
          </div>

          {/* Cost input */}
          <div className="min-w-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Cost
            </p>
            {isReview ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                  £
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={edit.costAdjusted ?? ''}
                  onChange={(e) => {
                    const val = e.target.value
                    onChange(defect.id, {
                      costAdjusted: val === '' ? null : Math.max(0, parseFloat(val)),
                    })
                  }}
                  className="h-9 w-28 rounded-lg border border-zinc-200 bg-white pl-7 pr-3 text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus:border-slate-400 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
            ) : (
              <span className="text-sm font-medium tabular-nums text-zinc-950">
                {effectiveCost != null ? formatCurrency(effectiveCost) : '—'}
              </span>
            )}
            {hasCostOverride ? (
              <p className="mt-1 text-[10px] text-amber-600">
                AI estimate: {formatCurrency(defect.costEstimate!)}
              </p>
            ) : null}
          </div>

          {/* AI confidence */}
          <div className="min-w-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              AI confidence
            </p>
            <span className="text-sm tabular-nums text-zinc-500">
              {defect.aiConfidence != null
                ? `${defect.aiConfidence <= 1 ? Math.round(defect.aiConfidence * 100) : Math.round(defect.aiConfidence)}%`
                : '—'}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Room group header                                                  */
/* ------------------------------------------------------------------ */

function RoomGroupHeader({
  room,
  defectCount,
  roomCost,
  isExpanded,
  onToggle,
}: {
  room: CheckoutWorkspaceRoomRecord | null
  defectCount: number
  roomCost: number
  isExpanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-[10px] border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-left transition-colors hover:bg-zinc-100/80"
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
      )}
      <div className="flex flex-1 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-950">
            {room?.roomName ?? 'Unassigned room'}
          </span>
          <span className="text-xs text-zinc-400">{defectCount} defect{defectCount !== 1 ? 's' : ''}</span>
          {room?.conditionCheckin && room?.conditionCheckout ? (
            <span className="hidden items-center gap-1 text-[10px] text-zinc-400 sm:inline-flex">
              <ConditionBadge value={room.conditionCheckin} />
              <span>→</span>
              <ConditionBadge value={room.conditionCheckout} />
            </span>
          ) : null}
        </div>
        <span className="text-sm font-medium tabular-nums text-zinc-600">
          {formatCurrency(roomCost)}
        </span>
      </div>
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Bulk actions bar                                                   */
/* ------------------------------------------------------------------ */

function BulkActionsBar({
  defects,
  edits,
  onBulkLiability,
  onAcceptAiSuggestions,
  onExcludeBelow,
}: {
  defects: CheckoutWorkspaceDefectRecord[]
  edits: Record<string, DefectEditState>
  onBulkLiability: (liability: CheckoutWorkspaceLiability) => void
  onAcceptAiSuggestions: () => void
  onExcludeBelow: (threshold: number) => void
}) {
  const [showThresholdInput, setShowThresholdInput] = useState(false)
  const [threshold, setThreshold] = useState('10')

  const pendingCount = defects.filter((d) => {
    const edit = edits[d.id]
    return edit && !edit.excluded && !edit.operatorLiability
  }).length

  const aiSuggestedCount = defects.filter((d) => d.aiSuggestedLiability && !edits[d.id]?.excluded).length

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Bulk:</span>
      <WorkspaceActionButton tone="secondary" onClick={onAcceptAiSuggestions}>
        <Sparkles className="h-3 w-3" />
        Accept AI ({aiSuggestedCount})
      </WorkspaceActionButton>
      {LIABILITY_OPTIONS.map((opt) => (
        <WorkspaceActionButton
          key={opt.value}
          tone="secondary"
          onClick={() => onBulkLiability(opt.value)}
          title={`Assign all ${pendingCount} unassigned defects as ${opt.label}`}
        >
          Unassigned → {opt.label} ({pendingCount})
        </WorkspaceActionButton>
      ))}
      {showThresholdInput ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-zinc-500">Exclude under £</span>
          <input
            type="number"
            min="0"
            step="1"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="h-7 w-16 rounded-lg border border-zinc-200 bg-white px-2 text-xs tabular-nums focus:border-slate-400 focus:outline-none"
          />
          <WorkspaceActionButton tone="secondary" onClick={() => {
            onExcludeBelow(parseFloat(threshold) || 0)
            setShowThresholdInput(false)
          }}>
            Apply
          </WorkspaceActionButton>
        </div>
      ) : (
        <WorkspaceActionButton tone="secondary" onClick={() => setShowThresholdInput(true)}>
          Exclude under £…
        </WorkspaceActionButton>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail panel (right side)                                          */
/* ------------------------------------------------------------------ */

function DetailPanel({
  defect,
  edit,
  room,
  evidence,
  isReview,
  onChange,
  onOpenDetail,
  onConfirmAndNext,
  onExclude,
}: {
  defect: CheckoutWorkspaceDefectRecord
  edit: DefectEditState
  room: CheckoutWorkspaceRoomRecord | null
  evidence: OperatorCheckoutWorkspaceData['workspace']['evidence']
  isReview: boolean
  onChange: (id: string, patch: Partial<DefectEditState>) => void
  onOpenDetail: (id: string) => void
  onConfirmAndNext: () => void
  onExclude: () => void
}) {
  const severity = getDefectSeverity(defect)
  const aiLiability = defect.aiSuggestedLiability
  const hasOverride =
    edit.operatorLiability !== null &&
    aiLiability !== null &&
    edit.operatorLiability !== aiLiability
  const hasCostOverride =
    defect.costEstimate !== null &&
    edit.costAdjusted !== null &&
    edit.costAdjusted !== defect.costEstimate
  const isReviewed = edit.operatorLiability !== null && !edit.excluded

  // Find evidence items related to this defect's room
  const room_name = room?.roomName ?? null
  const defectEvidence = evidence.filter((e) => room_name && e.area && e.area.toLowerCase() === room_name.toLowerCase()).slice(0, 4)

  return (
    <div className="rounded-[10px] border border-zinc-200 bg-white p-5 sticky top-0">
      {/* Title + severity */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-900">{defect.itemName}</h3>
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', severityBadgeTone(severity))}>
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenDetail(defect.id)}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-600"
          title="Full detail view"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Badges row */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {room ? (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">
            {room.roomName}
          </span>
        ) : null}
        <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-600">
          {formatEnumLabel(defect.defectType)}
        </span>
        {isReviewed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
            <Check className="h-2.5 w-2.5" />
            Reviewed
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-medium text-amber-700">
            Pending
          </span>
        )}
        {edit.excluded ? (
          <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium text-zinc-500">
            Excluded
          </span>
        ) : null}
      </div>

      {/* Description */}
      {defect.description ? (
        <p className="mt-3 text-[13px] leading-relaxed text-zinc-600">{defect.description}</p>
      ) : null}

      {/* Evidence boxes */}
      {defectEvidence.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Evidence</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {defectEvidence.map((ev, idx) => (
              <div key={ev.id ?? idx} className="flex h-24 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-400">
                {ev.file_url ? (
                  <img src={ev.file_url} alt={ev.area ?? 'Evidence'} className="h-full w-full rounded-lg object-cover" />
                ) : (
                  <span>{ev.area ?? 'No image'}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Evidence</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div className="flex h-24 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-400">
              No image
            </div>
            <div className="flex h-24 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-[11px] text-zinc-400">
              No image
            </div>
          </div>
        </div>
      )}

      {/* Liability group buttons */}
      {!edit.excluded ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Liability</p>
          {isReview ? (
            <div className="mt-2 flex overflow-hidden rounded-lg border border-zinc-200">
              {LIABILITY_OPTIONS.map((opt, idx) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(defect.id, { operatorLiability: opt.value })}
                  className={cn(
                    'flex-1 px-3 py-2 text-xs font-medium transition-colors',
                    idx > 0 && 'border-l border-zinc-200',
                    edit.operatorLiability === opt.value
                      ? opt.value === 'tenant'
                        ? 'bg-fuchsia-600 text-white'
                        : opt.value === 'landlord'
                          ? 'bg-sky-600 text-white'
                          : 'bg-orange-600 text-white'
                      : 'bg-white text-zinc-600 hover:bg-zinc-50'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <p className={cn(
              'mt-2 text-sm font-medium',
              edit.operatorLiability === 'tenant'
                ? 'text-fuchsia-700'
                : edit.operatorLiability === 'landlord'
                  ? 'text-sky-700'
                  : edit.operatorLiability === 'shared'
                    ? 'text-orange-700'
                    : 'text-zinc-400'
            )}>
              {edit.operatorLiability ? formatEnumLabel(edit.operatorLiability) : 'Unassigned'}
            </p>
          )}
          {hasOverride ? (
            <p className="mt-1 text-[10px] text-amber-600">AI suggested: {formatEnumLabel(aiLiability!)}</p>
          ) : null}
        </div>
      ) : null}

      {/* Cost adjustment */}
      {!edit.excluded ? (
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Cost adjustment</p>
            {defect.costEstimate != null ? (
              <span className="text-[10px] text-zinc-400">AI estimate: {formatCurrency(defect.costEstimate)}</span>
            ) : null}
          </div>
          {isReview ? (
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">£</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={edit.costAdjusted ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  onChange(defect.id, {
                    costAdjusted: val === '' ? null : Math.max(0, parseFloat(val)),
                  })
                }}
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-7 pr-3 text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus:border-slate-400 focus:outline-none"
                placeholder="0.00"
              />
            </div>
          ) : (
            <p className="mt-2 text-sm font-medium tabular-nums text-zinc-950">
              {edit.costAdjusted != null ? formatCurrency(edit.costAdjusted) : '—'}
            </p>
          )}
          {hasCostOverride ? (
            <p className="mt-1 text-[10px] text-amber-600">Modified from AI estimate</p>
          ) : null}
        </div>
      ) : null}

      {/* Include/Exclude toggle */}
      {isReview ? (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Include in claim</p>
          <button
            type="button"
            onClick={() => onChange(defect.id, { excluded: !edit.excluded })}
            className={cn(
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
              edit.excluded ? 'bg-zinc-200' : 'bg-emerald-500'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
                edit.excluded ? 'translate-x-0' : 'translate-x-5'
              )}
            />
          </button>
        </div>
      ) : null}

      {/* AI Rationale */}
      {defect.aiReasoning ? (
        <div className="mt-4 rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-zinc-400" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">AI Rationale</p>
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-600">{defect.aiReasoning}</p>
          {defect.aiConfidence != null ? (
            <p className="mt-1 text-[10px] text-zinc-400">
              Confidence: {defect.aiConfidence <= 1 ? Math.round(defect.aiConfidence * 100) : Math.round(defect.aiConfidence)}%
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Action buttons */}
      {isReview ? (
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onConfirmAndNext}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <Check className="h-3.5 w-3.5" />
            Confirm & Next
          </button>
          <button
            type="button"
            onClick={onExclude}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
          >
            <EyeOff className="h-3.5 w-3.5" />
            Exclude
          </button>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type ReviewTab = 'defects' | 'ai-documents'

export function StepReview({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ReviewTab>('defects')
  const [showSendConfirm, setShowSendConfirm] = useState(false)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isReview = caseStatus === 'review'
  const defects = data.defects
  const rooms = data.rooms
  const evidence = data.workspace.evidence
  const recommendations = data.workspace.recommendations
  const issues = data.workspace.issues
  const claim = data.workspace.claim
  const breakdown = data.workspace.claimBreakdown

  // Detail modal state
  const [detailDefectId, setDetailDefectId] = useState<string | null>(null)

  // Selected defect in the split panel
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null)

  const [edits, setEdits] = useState<Record<string, DefectEditState>>(() =>
    buildInitialEdits(defects)
  )
  const [isDirty, setIsDirty] = useState(false)

  // Filter and sort
  const [activeFilter, setActiveFilter] = useState<DefectFilter>('all')
  const [activeSort, setActiveSort] = useState<DefectSort>('room')
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set())

  // New filters for split-panel
  const [liabilityFilter, setLiabilityFilter] = useState<LiabilityFilter>('all')
  const [tradeFilter, setTradeFilter] = useState<TradeFilter>('all')

  const handleEditChange = useCallback(
    (id: string, patch: Partial<DefectEditState>) => {
      setEdits((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }))
      setIsDirty(true)
    },
    []
  )

  const handleResetAll = useCallback(() => {
    setEdits(buildInitialEdits(defects))
    setIsDirty(false)
  }, [defects])

  // Warn on navigation away with unsaved changes (browser + step nav)
  useEffect(() => {
    const w = window as unknown as Record<string, boolean>
    w.__workspaceDirty = isDirty
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => {
      window.removeEventListener('beforeunload', handler)
      w.__workspaceDirty = false
    }
  }, [isDirty])

  /* ---- Bulk actions ---- */
  const handleBulkLiability = useCallback(
    (liability: CheckoutWorkspaceLiability) => {
      setEdits((prev) => {
        const next = { ...prev }
        for (const d of defects) {
          if (next[d.id] && !next[d.id].excluded && !next[d.id].operatorLiability) {
            next[d.id] = { ...next[d.id], operatorLiability: liability }
          }
        }
        return next
      })
      setIsDirty(true)
    },
    [defects]
  )

  const handleAcceptAiSuggestions = useCallback(() => {
    setEdits((prev) => {
      const next = { ...prev }
      for (const d of defects) {
        if (d.aiSuggestedLiability && next[d.id] && !next[d.id].excluded) {
          next[d.id] = {
            ...next[d.id],
            operatorLiability: d.aiSuggestedLiability,
            costAdjusted: next[d.id].costAdjusted ?? d.costEstimate,
          }
        }
      }
      return next
    })
    setIsDirty(true)
    toast.success('AI suggestions accepted for all defects')
  }, [defects])

  const handleExcludeBelow = useCallback(
    (threshold: number) => {
      let count = 0
      setEdits((prev) => {
        const next = { ...prev }
        for (const d of defects) {
          const cost = next[d.id]?.costAdjusted ?? d.costEstimate ?? 0
          if (cost < threshold && !next[d.id]?.excluded) {
            next[d.id] = { ...next[d.id], excluded: true }
            count++
          }
        }
        return next
      })
      setIsDirty(true)
      toast.success(`Excluded ${count} defects under £${threshold}`)
    },
    [defects]
  )

  /* ---- Room grouping, filtering, sorting ---- */
  const roomMap = useMemo(() => {
    const map = new Map<string, CheckoutWorkspaceRoomRecord>()
    for (const room of rooms) map.set(room.id, room)
    return map
  }, [rooms])

  // Detail modal derived values (after roomMap is defined)
  const detailDefect = detailDefectId ? defects.find((d) => d.id === detailDefectId) ?? null : null
  const detailRoom = detailDefect ? roomMap.get(detailDefect.roomId) ?? null : null

  const filteredAndSorted = useMemo(() => {
    // Filter
    let filtered = defects
    if (activeFilter === 'pending') {
      filtered = defects.filter((d) => {
        const edit = edits[d.id]
        return edit && !edit.excluded && !edit.operatorLiability
      })
    } else if (activeFilter === 'tenant') {
      filtered = defects.filter((d) => edits[d.id]?.operatorLiability === 'tenant')
    } else if (activeFilter === 'landlord') {
      filtered = defects.filter((d) => edits[d.id]?.operatorLiability === 'landlord')
    } else if (activeFilter === 'shared') {
      filtered = defects.filter((d) => edits[d.id]?.operatorLiability === 'shared')
    } else if (activeFilter === 'excluded') {
      filtered = defects.filter((d) => edits[d.id]?.excluded)
    }

    // Sort
    const sorted = [...filtered]
    if (activeSort === 'cost-desc') {
      sorted.sort((a, b) => (edits[b.id]?.costAdjusted ?? b.costEstimate ?? 0) - (edits[a.id]?.costAdjusted ?? a.costEstimate ?? 0))
    } else if (activeSort === 'cost-asc') {
      sorted.sort((a, b) => (edits[a.id]?.costAdjusted ?? a.costEstimate ?? 0) - (edits[b.id]?.costAdjusted ?? b.costEstimate ?? 0))
    } else if (activeSort === 'type') {
      sorted.sort((a, b) => a.defectType.localeCompare(b.defectType))
    } else if (activeSort === 'confidence') {
      sorted.sort((a, b) => (b.aiConfidence ?? 0) - (a.aiConfidence ?? 0))
    } else {
      // Sort by room (default)
      sorted.sort((a, b) => {
        const roomA = roomMap.get(a.roomId)
        const roomB = roomMap.get(b.roomId)
        return (roomA?.sortOrder ?? 999) - (roomB?.sortOrder ?? 999)
      })
    }

    return sorted
  }, [defects, edits, activeFilter, activeSort, roomMap])

  // Additional filtering for the split-panel queue
  const queueFiltered = useMemo(() => {
    let result = filteredAndSorted

    // Liability filter
    if (liabilityFilter !== 'all') {
      result = result.filter((d) => edits[d.id]?.operatorLiability === liabilityFilter)
    }

    // Trade filter
    if (tradeFilter !== 'all') {
      result = result.filter((d) => d.defectType === tradeFilter)
    }

    return result
  }, [filteredAndSorted, liabilityFilter, tradeFilter, edits])

  // Group by room when sorting by room
  const groupedByRoom = useMemo(() => {
    if (activeSort !== 'room') return null

    const groups: { roomId: string; room: CheckoutWorkspaceRoomRecord | null; defects: CheckoutWorkspaceDefectRecord[] }[] = []
    const seen = new Map<string, number>()

    for (const d of filteredAndSorted) {
      const idx = seen.get(d.roomId)
      if (idx != null) {
        groups[idx].defects.push(d)
      } else {
        seen.set(d.roomId, groups.length)
        groups.push({
          roomId: d.roomId,
          room: roomMap.get(d.roomId) ?? null,
          defects: [d],
        })
      }
    }

    return groups
  }, [filteredAndSorted, activeSort, roomMap])

  /* ---- Computed totals ---- */
  const { tenantTotal, landlordTotal, sharedTotal, totalClaim, includedCount, excludedCount, reviewedCount } =
    useMemo(() => {
      let tenant = 0
      let landlord = 0
      let shared = 0
      let included = 0
      let excluded = 0
      let reviewed = 0

      for (const d of defects) {
        const edit = edits[d.id]
        if (!edit || edit.excluded) {
          excluded++
          continue
        }
        included++
        if (edit.operatorLiability) reviewed++
        const cost = edit.costAdjusted ?? d.costEstimate ?? 0
        if (edit.operatorLiability === 'tenant') tenant += cost
        else if (edit.operatorLiability === 'landlord') landlord += cost
        else if (edit.operatorLiability === 'shared') {
          const tenantShare = cost / 2
          tenant += tenantShare
          landlord += cost - tenantShare
          shared += cost
        }
      }

      return {
        tenantTotal: tenant,
        landlordTotal: landlord,
        sharedTotal: shared,
        totalClaim: tenant,
        includedCount: included,
        excludedCount: excluded,
        reviewedCount: reviewed,
      }
    }, [defects, edits])

  const depositHeld = data.checkoutCase?.depositHeld ?? 0
  const claimExceedsDeposit = depositHeld > 0 && totalClaim > depositHeld
  const reviewProgress = includedCount > 0 ? Math.round((reviewedCount / includedCount) * 100) : 0

  function getIssueTitle(issueId: string) {
    return issues.find((i) => i.id === issueId)?.title ?? 'Untitled issue'
  }

  const tenantName = data.workspace.tenant?.name ?? data.workspace.tenancy.tenant_name
  const landlordName = data.workspace.overview.landlords[0]?.fullName ?? 'Landlord'
  const tenantEmail = data.checkoutCase?.tenantEmail ?? data.workspace.tenant?.email
  const landlordEmail = data.checkoutCase?.landlordEmail

  const canSend = isReview && Boolean(landlordEmail || tenantEmail)

  /* ---- Save overrides ---- */
  async function handleSaveOverrides() {
    setIsSaving(true)
    setError(null)
    try {
      const updates = defects.map((d) => {
        const edit = edits[d.id]
        return {
          defectId: d.id,
          operatorLiability: edit?.excluded ? null : (edit?.operatorLiability ?? null),
          costAdjusted: edit?.excluded ? 0 : (edit?.costAdjusted ?? null),
          excluded: edit?.excluded ?? false,
        }
      })

      const res = await fetch(`/api/operator/cases/${caseId}/defects`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed to save defect overrides.')
      }

      setIsDirty(false)
      toast.success('Defect overrides saved successfully')
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save overrides.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSaving(false)
    }
  }

  /* ---- Send draft ---- */
  async function handleSendDraft() {
    setIsSending(true)
    setError(null)
    setShowSendConfirm(false)
    try {
      const propertyAddress = data.checkoutCase?.propertyAddress ?? 'Address not recorded'
      const caseRef = data.checkoutCase?.caseReference ?? caseId.slice(0, 8).toUpperCase()

      const sendResponse = await fetch(`/api/eot/cases/${caseId}/send-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landlordEmail: landlordEmail || undefined,
          landlordName,
          tenantEmail: tenantEmail || undefined,
          tenantName,
          propertyAddress,
          caseRef,
        }),
      })
      if (!sendResponse.ok) {
        const err = await sendResponse.json().catch(() => null)
        throw new Error(err?.detail || err?.error || `Failed to send draft emails (${sendResponse.status}).`)
      }
      toast.success('Emails sent successfully')
      const transitionResponse = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft_sent' }),
      })
      if (!transitionResponse.ok) {
        const err = await transitionResponse.json().catch(() => null)
        throw new Error(err?.detail || 'Emails sent but status transition failed.')
      }
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to send draft.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsSending(false)
    }
  }

  const aiDraftCount = (data.aiDrafts ?? []).length

  /* ---- Filter counts ---- */
  const filterCounts = useMemo(() => {
    const counts: Record<DefectFilter, number> = {
      all: defects.length,
      pending: 0,
      tenant: 0,
      landlord: 0,
      shared: 0,
      excluded: 0,
    }
    for (const d of defects) {
      const edit = edits[d.id]
      if (!edit) continue
      if (edit.excluded) { counts.excluded++; continue }
      if (edit.operatorLiability === 'tenant') counts.tenant++
      else if (edit.operatorLiability === 'landlord') counts.landlord++
      else if (edit.operatorLiability === 'shared') counts.shared++
      else counts.pending++
    }
    return counts
  }, [defects, edits])

  // Auto-select first defect if none selected
  useEffect(() => {
    if (!selectedDefectId && queueFiltered.length > 0) {
      setSelectedDefectId(queueFiltered[0].id)
    }
  }, [selectedDefectId, queueFiltered])

  // Selected defect and room for detail panel
  const selectedDefect = selectedDefectId ? defects.find((d) => d.id === selectedDefectId) ?? null : null
  const selectedRoom = selectedDefect ? roomMap.get(selectedDefect.roomId) ?? null : null

  // Confirm & Next handler for detail panel
  const handleConfirmAndNext = useCallback(() => {
    if (!selectedDefectId) return
    const currentIdx = queueFiltered.findIndex((d) => d.id === selectedDefectId)
    if (currentIdx >= 0 && currentIdx < queueFiltered.length - 1) {
      setSelectedDefectId(queueFiltered[currentIdx + 1].id)
    }
  }, [selectedDefectId, queueFiltered])

  // Exclude handler for detail panel
  const handleDetailExclude = useCallback(() => {
    if (!selectedDefectId) return
    handleEditChange(selectedDefectId, { excluded: true })
  }, [selectedDefectId, handleEditChange])

  // Total exposure (sum of all non-excluded costs)
  const totalExposure = useMemo(() => {
    let total = 0
    for (const d of defects) {
      const edit = edits[d.id]
      if (!edit || edit.excluded) continue
      total += edit.costAdjusted ?? d.costEstimate ?? 0
    }
    return total
  }, [defects, edits])

  return (
    <div className="space-y-5">
      {/* ---- Review sub-tabs ---- */}
      <div className="flex items-center gap-1 border-b border-zinc-200">
        <button
          type="button"
          onClick={() => setActiveTab('defects')}
          className={cn(
            'relative px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'defects'
              ? 'text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-600'
          )}
        >
          Defect Review
          {activeTab === 'defects' ? (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('ai-documents')}
          className={cn(
            'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'ai-documents'
              ? 'text-zinc-950'
              : 'text-zinc-400 hover:text-zinc-600'
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI Documents
          {aiDraftCount > 0 ? (
            <span className="ml-1 inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-sky-100 px-1.5 text-[10px] font-semibold text-sky-700">
              {aiDraftCount}
            </span>
          ) : null}
          {activeTab === 'ai-documents' ? (
            <span className="absolute inset-x-0 -bottom-px h-0.5 bg-zinc-950" />
          ) : null}
        </button>
      </div>

      {/* ---- AI Documents tab ---- */}
      {activeTab === 'ai-documents' ? (
        <AIAssistantPanel data={data} />
      ) : null}

      {/* ---- Defect Review tab ---- */}
      {activeTab === 'defects' ? (
      <>
      {/* ---- Stats row ---- */}
      {defects.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Defects count */}
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Defects</p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-zinc-900">{defects.length}</p>
          </div>
          {/* Reviewed */}
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Reviewed</p>
            <p className={cn(
              'mt-1 text-[28px] font-bold tabular-nums leading-tight',
              reviewedCount === includedCount && includedCount > 0 ? 'text-emerald-600' : reviewedCount > 0 ? 'text-amber-600' : 'text-zinc-900'
            )}>
              {reviewedCount}/{includedCount}
            </p>
          </div>
          {/* Total Exposure */}
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Total Exposure</p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-zinc-900">{formatCurrency(totalExposure)}</p>
          </div>
          {/* Excluded */}
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Excluded</p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-zinc-900">{excludedCount}</p>
          </div>
        </div>
      ) : null}

      {/* ---- Deposit vs claim warning ---- */}
      {claimExceedsDeposit ? (
        <WorkspaceNotice
          tone="warning"
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Claim exceeds deposit held"
          body={
            <span>
              Tenant liability of <strong>{formatCurrency(totalClaim)}</strong> exceeds the
              deposit of <strong>{formatCurrency(depositHeld)}</strong> by{' '}
              <strong>{formatCurrency(totalClaim - depositHeld)}</strong>. Consider adjusting
              costs or excluding lower-priority items.
            </span>
          }
        />
      ) : null}

      {/* ---- Bulk actions ---- */}
      {isReview && defects.length > 3 ? (
        <BulkActionsBar
          defects={defects}
          edits={edits}
          onBulkLiability={handleBulkLiability}
          onAcceptAiSuggestions={handleAcceptAiSuggestions}
          onExcludeBelow={handleExcludeBelow}
        />
      ) : null}

      {/* ---- Split-panel layout ---- */}
      {defects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 min-h-[420px] lg:grid-cols-[340px_1fr]">
          {/* Left panel - Defect queue */}
          <div className="flex flex-col gap-3">
            {/* Filter pills */}
            <div className="space-y-2">
              {/* Liability filter row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 mr-1">Liability:</span>
                {LIABILITY_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLiabilityFilter(opt.value)}
                    className={cn(
                      'rounded-full border px-3.5 py-1 text-[11px] font-medium transition-colors',
                      liabilityFilter === opt.value
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {/* Trade filter row */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 mr-1">Trade:</span>
                {TRADE_FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTradeFilter(opt.value)}
                    className={cn(
                      'rounded-full border px-3.5 py-1 text-[11px] font-medium transition-colors',
                      tradeFilter === opt.value
                        ? 'bg-zinc-900 text-white border-zinc-900'
                        : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Queue list */}
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {queueFiltered.length > 0 ? (
                queueFiltered.map((d) => (
                  <DefectQueueCard
                    key={d.id}
                    defect={d}
                    edit={edits[d.id] ?? { operatorLiability: null, costAdjusted: null, excluded: false }}
                    isSelected={selectedDefectId === d.id}
                    roomMap={roomMap}
                    onClick={() => setSelectedDefectId(d.id)}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center rounded-[10px] border border-dashed border-zinc-200 py-10">
                  <p className="text-sm text-zinc-400">No defects match filters</p>
                </div>
              )}
            </div>

            {/* Queue summary */}
            <div className="flex items-center justify-between rounded-[10px] border border-zinc-200 bg-zinc-50 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
                Showing {queueFiltered.length} of {defects.length}
              </span>
              {isReview && defects.length > 0 ? (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 hover:text-zinc-600"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              ) : null}
            </div>
          </div>

          {/* Right panel - Detail view */}
          <div>
            {selectedDefect && edits[selectedDefect.id] ? (
              <DetailPanel
                defect={selectedDefect}
                edit={edits[selectedDefect.id]}
                room={selectedRoom}
                evidence={evidence}
                isReview={isReview}
                onChange={handleEditChange}
                onOpenDetail={setDetailDefectId}
                onConfirmAndNext={handleConfirmAndNext}
                onExclude={handleDetailExclude}
              />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[10px] border border-dashed border-zinc-200 bg-white p-10">
                <div className="text-center">
                  <p className="text-sm font-medium text-zinc-400">Select a defect</p>
                  <p className="mt-1 text-xs text-zinc-300">Choose a defect from the queue to review its details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-[10px] border border-dashed border-zinc-200 bg-white py-16">
          <p className="text-sm text-zinc-400">No defects identified.</p>
        </div>
      )}

      {/* Save overrides — sticky bar when dirty */}
      {isReview && defects.length > 0 ? (
        <div className={cn(
          'flex items-center gap-3',
          isDirty ? 'sticky bottom-0 z-10 -mx-6 rounded-[10px] border border-amber-200 bg-amber-50/95 px-6 py-3 md:-mx-7 md:px-7' : ''
        )}>
          <WorkspaceActionButton
            tone={isDirty ? 'primary' : 'secondary'}
            disabled={isSaving}
            onClick={handleSaveOverrides}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save review overrides
          </WorkspaceActionButton>
          {isDirty ? (
            <span className="text-xs text-amber-600">Unsaved changes</span>
          ) : null}
        </div>
      ) : null}

      <div className="border-t border-zinc-100" />

      {/* ---- Claim summary (live-calculated) ---- */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Claim summary</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Tenant liability
            </p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-fuchsia-700">
              {formatCurrency(tenantTotal)}
            </p>
          </div>
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Landlord cost
            </p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-sky-700">
              {formatCurrency(landlordTotal)}
            </p>
          </div>
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Shared
            </p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-orange-700">
              {formatCurrency(sharedTotal)}
            </p>
            {sharedTotal > 0 ? (
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {formatCurrency(sharedTotal / 2)} tenant · {formatCurrency(sharedTotal / 2)} landlord
              </p>
            ) : null}
          </div>
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Deposit held
            </p>
            <p className="mt-1 text-[28px] font-bold tabular-nums leading-tight text-zinc-950">
              {depositHeld > 0 ? formatCurrency(depositHeld) : '—'}
            </p>
          </div>
        </div>
      </section>

      <div className="border-t border-zinc-100" />

      {/* ---- Recommendations (read-only) ---- */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Recommendations</h3>
        {recommendations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {recommendations.map((rec) => (
              <div key={rec.id} className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-950">
                      {getIssueTitle(rec.issue_id)}
                    </p>
                    {rec.rationale ? (
                      <p className="mt-1 text-xs leading-5 text-zinc-500 line-clamp-2">
                        {rec.rationale}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span
                      className={
                        rec.decision === 'charge'
                          ? 'font-medium text-amber-700'
                          : rec.decision === 'partial'
                            ? 'font-medium text-violet-700'
                            : 'text-emerald-700'
                      }
                    >
                      {formatEnumLabel(rec.decision)}
                    </span>
                    {rec.estimated_cost != null ? (
                      <span className="font-medium text-zinc-950">
                        {formatCurrency(rec.estimated_cost)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No recommendations generated.</p>
        )}
      </section>

      {/* ---- Breakdown table (from original claim if exists) ---- */}
      {claim && breakdown.length > 0 ? (
        <>
          <div className="border-t border-zinc-100" />
          <section>
            <h3 className="text-sm font-semibold text-zinc-950">Original claim breakdown</h3>
            <p className="mt-1 text-xs text-zinc-400">
              AI-generated breakdown — use the defect overrides above to adjust the final claim.
            </p>
            <div className="mt-3 overflow-hidden rounded-[10px] border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                      Item
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
                      Decision
                    </th>
                    <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((item) => (
                    <tr key={item.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-zinc-950">{item.title}</td>
                      <td className="px-4 py-2.5 text-zinc-600">
                        {item.decision ? formatEnumLabel(item.decision) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-zinc-600">
                        {formatCurrency(item.estimatedCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {/* ---- Error ---- */}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {/* ---- Send draft ---- */}
      {isReview ? (
        <div className="border-t border-zinc-200 pt-6">
          <p className="mb-3 text-sm text-zinc-600">
            Sending the draft will email the complete checkout report to{' '}
            <span className="font-medium text-zinc-950">{landlordName}</span>
            {landlordEmail ? ` (${landlordEmail})` : ' (no email set)'} and tenant liabilities to{' '}
            <span className="font-medium text-zinc-950">{tenantName}</span>
            {tenantEmail ? ` (${tenantEmail})` : ' (no email set)'}.
          </p>

          {isDirty ? (
            <WorkspaceNotice
              tone="warning"
              icon={<AlertTriangle className="h-4 w-4" />}
              title="Unsaved changes"
              body="You have unsaved defect overrides. Save your changes before sending the draft."
              actions={
                <WorkspaceActionButton
                  tone="secondary"
                  disabled={isSaving}
                  onClick={handleSaveOverrides}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save now
                </WorkspaceActionButton>
              }
            />
          ) : null}

          <WorkspaceActionButton
            disabled={!canSend || isSending || isDirty}
            tone="primary"
            onClick={() => setShowSendConfirm(true)}
          >
            Send draft to parties
          </WorkspaceActionButton>

          {!canSend && isReview ? (
            <p className="mt-2 text-xs text-zinc-500">
              At least one email address (landlord or tenant) is required to send the draft.
            </p>
          ) : null}
        </div>
      ) : null}
      </>
      ) : null}

      {/* ---- Send confirmation modal ---- */}
      <ConfirmDialog
        open={showSendConfirm}
        title="Send draft to parties?"
        description={`This will email the checkout report to ${[landlordEmail && 'landlord', tenantEmail && 'tenant'].filter(Boolean).join(' and ')}. This action transitions the case to draft sent and cannot be undone.`}
        confirmLabel={isSending ? 'Sending...' : 'Send emails'}
        cancelLabel="Cancel"
        onConfirm={handleSendDraft}
        onCancel={() => setShowSendConfirm(false)}
      />

      {/* ---- Defect detail modal ---- */}
      {detailDefect ? (
        <DefectDetailModal
          open={detailDefectId !== null}
          defect={detailDefect}
          room={detailRoom}
          edit={edits[detailDefect.id] ?? { operatorLiability: null, costAdjusted: null, excluded: false }}
          evidence={evidence}
          isReview={isReview}
          siblingDefects={filteredAndSorted}
          onChange={handleEditChange}
          onClose={() => setDetailDefectId(null)}
          onNavigate={setDetailDefectId}
        />
      ) : null}
    </div>
  )
}
