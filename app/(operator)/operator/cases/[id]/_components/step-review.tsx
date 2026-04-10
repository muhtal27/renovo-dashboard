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
/*  Defect row                                                         */
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
      className={`border border-zinc-200 px-4 py-4 transition ${edit.excluded ? 'opacity-50' : ''}`}
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
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-600"
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
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                edit.excluded
                  ? 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'
                  : 'bg-white text-zinc-500 hover:bg-zinc-50'
              }`}
              title={edit.excluded ? 'Include this defect' : 'Exclude this defect'}
            >
              {edit.excluded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {edit.excluded ? 'Excluded' : 'Include'}
            </button>
          ) : null}
        </div>
      </div>

      {/* Editable fields */}
      {!edit.excluded ? (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          {/* Liability toggle */}
          <div className="min-w-0">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
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
                className={`text-sm font-medium ${
                  edit.operatorLiability === 'tenant'
                    ? 'text-fuchsia-700'
                    : edit.operatorLiability === 'landlord'
                      ? 'text-sky-700'
                      : edit.operatorLiability === 'shared'
                        ? 'text-orange-700'
                        : 'text-zinc-400'
                }`}
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
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
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
                  className="h-9 w-28 border border-zinc-200 bg-white pl-7 pr-3 text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus:border-slate-400 focus:outline-none"
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
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
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
      className="flex w-full items-center gap-3 border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-left transition-colors hover:bg-zinc-100/80"
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
    <div className="flex flex-wrap items-center gap-2 border border-zinc-200 bg-zinc-50/60 px-4 py-3">
      <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Bulk:</span>
      <WorkspaceActionButton tone="secondary" onClick={onAcceptAiSuggestions}>
        <Sparkles className="h-3 w-3" />
        Accept AI ({aiSuggestedCount})
      </WorkspaceActionButton>
      {LIABILITY_OPTIONS.map((opt) => (
        <WorkspaceActionButton
          key={opt.value}
          tone="secondary"
          onClick={() => onBulkLiability(opt.value)}
        >
          All {opt.label} ({pendingCount})
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
            className="h-7 w-16 border border-zinc-200 bg-white px-2 text-xs tabular-nums focus:border-slate-400 focus:outline-none"
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

  const [edits, setEdits] = useState<Record<string, DefectEditState>>(() =>
    buildInitialEdits(defects)
  )
  const [isDirty, setIsDirty] = useState(false)

  // Filter and sort
  const [activeFilter, setActiveFilter] = useState<DefectFilter>('all')
  const [activeSort, setActiveSort] = useState<DefectSort>('room')
  const [collapsedRooms, setCollapsedRooms] = useState<Set<string>>(new Set())

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

  // Warn on navigation away with unsaved changes
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
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

  return (
    <div className="space-y-6">
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
      {/* ---- Review progress bar ---- */}
      {defects.length > 0 ? (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Review progress
              </p>
              <span className="text-xs tabular-nums text-zinc-500">
                {reviewedCount}/{includedCount} reviewed
              </span>
            </div>
            <WorkspaceProgressBar
              value={reviewProgress}
              max={100}
              tone={reviewProgress === 100 ? 'success' : reviewProgress >= 50 ? 'warning' : 'danger'}
            />
          </div>
          {reviewProgress === 100 && includedCount > 0 ? (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" />
              Complete
            </div>
          ) : null}
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

      {/* ---- Filter + Sort toolbar ---- */}
      {defects.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3">
          {/* Filters */}
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-zinc-400" />
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setActiveFilter(opt.value)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  activeFilter === opt.value
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700'
                )}
              >
                {opt.label}
                {filterCounts[opt.value] > 0 ? (
                  <span className={cn(
                    'ml-1 tabular-nums',
                    activeFilter === opt.value ? 'text-zinc-300' : 'text-zinc-400'
                  )}>
                    {filterCounts[opt.value]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1">
            <SortAsc className="h-3.5 w-3.5 text-zinc-400" />
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as DefectSort)}
              className="h-7 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600 focus:border-slate-400 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
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

      {/* ---- Defects section ---- */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-zinc-950">Defects</h3>
            <span className="text-xs text-zinc-400">
              {includedCount} included{excludedCount > 0 ? ` · ${excludedCount} excluded` : ''}
              {activeFilter !== 'all' ? ` · showing ${filteredAndSorted.length}` : ''}
            </span>
          </div>
          {isReview && defects.length > 0 ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetAll}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-600"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>
          ) : null}
        </div>

        {filteredAndSorted.length > 0 ? (
          <div className="mt-3 space-y-2">
            {groupedByRoom ? (
              // Grouped by room
              groupedByRoom.map((group) => {
                const isCollapsed = collapsedRooms.has(group.roomId)
                const roomCost = group.defects.reduce((sum, d) => {
                  const edit = edits[d.id]
                  if (!edit || edit.excluded) return sum
                  return sum + (edit.costAdjusted ?? d.costEstimate ?? 0)
                }, 0)

                return (
                  <div key={group.roomId}>
                    <RoomGroupHeader
                      room={group.room}
                      defectCount={group.defects.length}
                      roomCost={roomCost}
                      isExpanded={!isCollapsed}
                      onToggle={() => {
                        setCollapsedRooms((prev) => {
                          const next = new Set(prev)
                          if (next.has(group.roomId)) next.delete(group.roomId)
                          else next.add(group.roomId)
                          return next
                        })
                      }}
                    />
                    {!isCollapsed ? (
                      <div className="ml-4 mt-1 space-y-2 border-l-2 border-zinc-100 pl-4">
                        {group.defects.map((d) => (
                          <DefectRow
                            key={d.id}
                            defect={d}
                            edit={edits[d.id] ?? { operatorLiability: null, costAdjusted: null, excluded: false }}
                            isReview={isReview}
                            onChange={handleEditChange}
                            onOpenDetail={setDetailDefectId}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })
            ) : (
              // Flat list (when not sorting by room)
              filteredAndSorted.map((d) => (
                <DefectRow
                  key={d.id}
                  defect={d}
                  edit={edits[d.id] ?? { operatorLiability: null, costAdjusted: null, excluded: false }}
                  isReview={isReview}
                  onChange={handleEditChange}
                  onOpenDetail={setDetailDefectId}
                />
              ))
            )}
          </div>
        ) : defects.length > 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No defects match the current filter.</p>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No defects identified.</p>
        )}

        {/* Save overrides button */}
        {isReview && defects.length > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <WorkspaceActionButton
              tone="secondary"
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
      </section>

      <div className="border-t border-zinc-100" />

      {/* ---- Claim summary (live-calculated) ---- */}
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Claim summary</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="border border-zinc-200 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Tenant liability
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-fuchsia-700">
              {formatCurrency(tenantTotal)}
            </p>
          </div>
          <div className="border border-zinc-200 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Landlord cost
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-sky-700">
              {formatCurrency(landlordTotal)}
            </p>
          </div>
          <div className="border border-zinc-200 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Shared
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-orange-700">
              {formatCurrency(sharedTotal)}
            </p>
            {sharedTotal > 0 ? (
              <p className="mt-0.5 text-[10px] text-zinc-500">
                {formatCurrency(sharedTotal / 2)} tenant · {formatCurrency(sharedTotal / 2)} landlord
              </p>
            ) : null}
          </div>
          <div className="border border-zinc-200 px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
              Deposit held
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-950">
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
              <div key={rec.id} className="border border-zinc-200 px-4 py-3">
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
            <div className="mt-3 overflow-hidden border border-zinc-200">
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
