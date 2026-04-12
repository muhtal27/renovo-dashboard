'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  ImageOff,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
  ZoomIn,
} from 'lucide-react'
import {
  ConditionBadge,
  WorkspaceBadge,
  WorkspaceOptionButton,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import type { EotEvidence } from '@/lib/eot-types'
import type {
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceLiability,
  CheckoutWorkspaceRoomRecord,
} from '@/lib/operator-checkout-workspace-types'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DefectEditState = {
  operatorLiability: CheckoutWorkspaceLiability | null
  costAdjusted: number | null
  excluded: boolean
}

type DefectDetailModalProps = {
  open: boolean
  defect: CheckoutWorkspaceDefectRecord
  room: CheckoutWorkspaceRoomRecord | null
  edit: DefectEditState
  evidence: EotEvidence[]
  isReview: boolean
  /** All defects in current filtered list for prev/next navigation */
  siblingDefects: CheckoutWorkspaceDefectRecord[]
  onChange: (id: string, patch: Partial<DefectEditState>) => void
  onClose: () => void
  onNavigate: (defectId: string) => void
}

const LIABILITY_OPTIONS: {
  value: CheckoutWorkspaceLiability
  label: string
  tone: 'tenant' | 'landlord' | 'shared'
}[] = [
  { value: 'tenant', label: 'Tenant', tone: 'tenant' },
  { value: 'landlord', label: 'Landlord', tone: 'landlord' },
  { value: 'shared', label: 'Shared', tone: 'shared' },
]

/* ------------------------------------------------------------------ */
/*  Evidence gallery                                                   */
/* ------------------------------------------------------------------ */

function EvidenceGallery({
  title,
  evidence,
  emptyLabel,
  tone,
}: {
  title: string
  evidence: EotEvidence[]
  emptyLabel: string
  tone: 'emerald' | 'sky'
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const images = evidence.filter((e) => e.type === 'image')
  const current = images[activeIndex] ?? null

  // Reset index when evidence changes
  useEffect(() => {
    setActiveIndex(0)
  }, [evidence])

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-10">
        <ImageOff className="h-8 w-8 text-zinc-300" />
        <p className="mt-2 text-xs font-medium text-zinc-400">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Label */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className={cn('h-3.5 w-3.5', tone === 'emerald' ? 'text-emerald-500' : 'text-sky-500')} />
          <p className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', tone === 'emerald' ? 'text-emerald-600' : 'text-sky-600')}>
            {title}
          </p>
        </div>
        <span className="text-[10px] tabular-nums text-zinc-400">
          {activeIndex + 1}/{images.length}
        </span>
      </div>

      {/* Main image */}
      <div className="group relative overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
        {current ? (
          <>
            <img
              src={current.file_url}
              alt={current.area || title}
              className="h-[240px] w-full object-cover transition-transform"
              loading="lazy"
            />
            {/* Overlay actions */}
            <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-zinc-950/40 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
              {current.area ? (
                <span className="rounded-md bg-zinc-950/60 px-2 py-0.5 text-[10px] font-medium text-white ">
                  {current.area}
                </span>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="rounded-md bg-zinc-950/60 p-1.5 text-white  transition hover:bg-zinc-950/80"
                title="View full size"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 ? (
        <div className="mt-2 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
            disabled={activeIndex === 0}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30"
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {images.map((img, idx) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  'h-10 w-10 shrink-0 overflow-hidden rounded border transition',
                  idx === activeIndex
                    ? tone === 'emerald'
                      ? 'border-emerald-400 ring-1 ring-emerald-400/30'
                      : 'border-sky-400 ring-1 ring-sky-400/30'
                    : 'border-zinc-200 hover:border-zinc-300'
                )}
              >
                <img
                  src={img.file_url}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex((prev) => Math.min(images.length - 1, prev + 1))}
            disabled={activeIndex === images.length - 1}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      {/* Lightbox */}
      {lightbox && current ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-zinc-950/80 "
          onClick={() => setLightbox(false)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={current.file_url}
              alt={current.area || title}
              className="max-h-[85vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setLightbox(false)}
              className="absolute -right-3 -top-3 rounded-full bg-zinc-900 p-1.5 text-white shadow-lg transition hover:bg-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>
            {/* Nav in lightbox */}
            {images.length > 1 ? (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-zinc-900/80 px-4 py-2 ">
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                  disabled={activeIndex === 0}
                  className="text-white/70 transition hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs tabular-nums text-white/80">
                  {activeIndex + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveIndex((prev) => Math.min(images.length - 1, prev + 1))}
                  disabled={activeIndex === images.length - 1}
                  className="text-white/70 transition hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Condition comparison row                                           */
/* ------------------------------------------------------------------ */

function ConditionComparison({
  label,
  checkin,
  checkout,
}: {
  label: string
  checkin: string | null
  checkout: string | null
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <div className="flex items-center gap-2">
        {checkin ? (
          <ConditionBadge value={checkin} />
        ) : (
          <span className="text-[10px] text-zinc-400">—</span>
        )}
        <span className="text-[10px] text-zinc-400">→</span>
        {checkout ? (
          <ConditionBadge value={checkout} />
        ) : (
          <span className="text-[10px] text-zinc-400">—</span>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main modal                                                         */
/* ------------------------------------------------------------------ */

export function DefectDetailModal({
  open,
  defect,
  room,
  edit,
  evidence,
  isReview,
  siblingDefects,
  onChange,
  onClose,
  onNavigate,
}: DefectDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Keyboard navigation
  const currentIndex = siblingDefects.findIndex((d) => d.id === defect.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < siblingDefects.length - 1

  const handleKeydown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev) {
        onNavigate(siblingDefects[currentIndex - 1].id)
      } else if (e.key === 'ArrowRight' && hasNext) {
        onNavigate(siblingDefects[currentIndex + 1].id)
      }
    },
    [open, onClose, onNavigate, siblingDefects, currentIndex, hasPrev, hasNext]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown)
    return () => document.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [open])

  // Match evidence to room by area name
  const roomEvidence = useMemo(() => {
    if (!room) return { checkin: [], checkout: [] }

    const roomName = room.roomName.toLowerCase()

    // Split evidence into check-in vs checkout by metadata or heuristic
    // Evidence with 'check_in' or 'checkin' area tag goes to check-in,
    // otherwise it's checkout evidence
    const checkin: EotEvidence[] = []
    const checkout: EotEvidence[] = []

    for (const ev of evidence) {
      if (ev.type !== 'image') continue

      const area = (ev.area ?? '').toLowerCase()
      const matchesRoom =
        area.includes(roomName) ||
        roomName.includes(area) ||
        area === roomName

      if (!matchesRoom && area !== '') continue

      // Check if it's check-in evidence
      const isCheckin =
        area.includes('check-in') ||
        area.includes('checkin') ||
        area.includes('check_in') ||
        (ev.metadata?.report_type === 'check_in') ||
        (ev.metadata?.type === 'checkin')

      if (isCheckin) {
        checkin.push(ev)
      } else {
        checkout.push(ev)
      }
    }

    return { checkin, checkout }
  }, [room, evidence])

  const totalPhotos = roomEvidence.checkin.length + roomEvidence.checkout.length

  // AI analysis
  const aiLiability = defect.aiSuggestedLiability
  const hasOverride =
    edit.operatorLiability !== null &&
    aiLiability !== null &&
    edit.operatorLiability !== aiLiability
  const hasCostOverride =
    defect.costEstimate !== null &&
    edit.costAdjusted !== null &&
    edit.costAdjusted !== defect.costEstimate
  const aiConfidencePercent = defect.aiConfidence != null
    ? defect.aiConfidence <= 1
      ? Math.round(defect.aiConfidence * 100)
      : Math.round(defect.aiConfidence)
    : null

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-zinc-950/50 "
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="my-6 w-full max-w-[960px] rounded-xl border border-zinc-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ---- Header ---- */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-zinc-950">
              {defect.itemName}
            </h2>
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
          <div className="flex items-center gap-2">
            {/* Navigation */}
            {siblingDefects.length > 1 ? (
              <div className="mr-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => hasPrev && onNavigate(siblingDefects[currentIndex - 1].id)}
                  disabled={!hasPrev}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30"
                  title="Previous defect (←)"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <span className="text-[10px] tabular-nums text-zinc-400">
                  {currentIndex + 1}/{siblingDefects.length}
                </span>
                <button
                  type="button"
                  onClick={() => hasNext && onNavigate(siblingDefects[currentIndex + 1].id)}
                  disabled={!hasNext}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-30"
                  title="Next defect (→)"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              title="Close (Esc)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ---- Body ---- */}
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px]">
          {/* Left: Evidence comparison */}
          <div className="min-w-0 space-y-5">
            {/* Room context */}
            {room ? (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-zinc-700">{room.roomName}</p>
                    <span className="text-[10px] text-zinc-400">
                      {room.defectCount} defect{room.defectCount !== 1 ? 's' : ''}
                    </span>
                    {totalPhotos > 0 ? (
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Camera className="h-3 w-3" />
                        {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 space-y-1.5">
                  <ConditionComparison
                    label="Condition"
                    checkin={room.conditionCheckin}
                    checkout={room.conditionCheckout}
                  />
                  <ConditionComparison
                    label="Cleanliness"
                    checkin={room.cleanlinessCheckin}
                    checkout={room.cleanlinessCheckout}
                  />
                </div>
              </div>
            ) : null}

            {/* Side-by-side evidence */}
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Evidence comparison
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <EvidenceGallery
                  title="Check-in"
                  evidence={roomEvidence.checkin}
                  emptyLabel="No check-in photos"
                  tone="emerald"
                />
                <EvidenceGallery
                  title="Checkout"
                  evidence={roomEvidence.checkout}
                  emptyLabel="No checkout photos"
                  tone="sky"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Description
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-700 [overflow-wrap:anywhere]">
                {defect.description || 'No description recorded.'}
              </p>
            </div>

            {/* Condition details */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Current condition
                </p>
                <div className="mt-2">
                  <ConditionBadge value={defect.conditionCurrent} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                  Current cleanliness
                </p>
                <div className="mt-2">
                  <ConditionBadge value={defect.cleanlinessCurrent} />
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI analysis + controls */}
          <div className="space-y-5 border-l border-zinc-200 pl-6">
            {/* AI analysis panel */}
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-600">
                  AI analysis
                </p>
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">Suggested liability</span>
                  {aiLiability ? (
                    <WorkspaceBadge
                      label={formatEnumLabel(aiLiability)}
                      tone={aiLiability}
                    />
                  ) : (
                    <span className="text-xs text-zinc-400">None</span>
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">Confidence</span>
                  <span
                    className={cn(
                      'text-xs font-medium tabular-nums',
                      aiConfidencePercent != null && aiConfidencePercent >= 75
                        ? 'text-emerald-600'
                        : aiConfidencePercent != null && aiConfidencePercent >= 50
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                    )}
                  >
                    {aiConfidencePercent != null ? `${aiConfidencePercent}%` : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-zinc-500">Estimated cost</span>
                  <span className="text-xs font-medium tabular-nums text-zinc-700">
                    {defect.costEstimate != null ? formatCurrency(defect.costEstimate) : '—'}
                  </span>
                </div>
              </div>
              {defect.aiReasoning ? (
                <div className="mt-3 rounded-lg border border-sky-100 bg-sky-50/50 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-600/70">
                    Reasoning
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-sky-900/70 [overflow-wrap:anywhere]">
                    {defect.aiReasoning}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="border-t border-zinc-200" />

            {/* Operator controls */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Operator decision
              </p>

              {/* Exclude toggle */}
              {isReview ? (
                <button
                  type="button"
                  onClick={() => onChange(defect.id, { excluded: !edit.excluded })}
                  className={cn(
                    'mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition',
                    edit.excluded
                      ? 'border-zinc-300 bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50'
                  )}
                >
                  {edit.excluded ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                  {edit.excluded ? 'Excluded from claim' : 'Include in claim'}
                </button>
              ) : null}

              {/* Liability */}
              {!edit.excluded ? (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Liability
                  </p>
                  {isReview ? (
                    <div className="flex gap-1.5">
                      {LIABILITY_OPTIONS.map((opt) => (
                        <WorkspaceOptionButton
                          key={opt.value}
                          selected={edit.operatorLiability === opt.value}
                          tone={opt.tone}
                          onClick={() =>
                            onChange(defect.id, { operatorLiability: opt.value })
                          }
                          className="flex-1 px-2 py-2 text-xs"
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
                      {edit.operatorLiability
                        ? formatEnumLabel(edit.operatorLiability)
                        : 'Unassigned'}
                    </span>
                  )}
                  {hasOverride ? (
                    <p className="mt-1.5 text-[10px] text-amber-600">
                      AI suggested: {formatEnumLabel(aiLiability!)}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {/* Cost */}
              {!edit.excluded ? (
                <div className="mt-4">
                  <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-zinc-400">
                    Adjusted cost
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
                            costAdjusted:
                              val === '' ? null : Math.max(0, parseFloat(val)),
                          })
                        }}
                        className="h-10 w-full rounded-md border border-zinc-200 bg-white pl-7 pr-3 text-sm text-zinc-900 tabular-nums placeholder:text-zinc-400 focus:border-slate-400 focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <span className="text-sm font-medium tabular-nums text-zinc-950">
                      {edit.costAdjusted != null
                        ? formatCurrency(edit.costAdjusted)
                        : '—'}
                    </span>
                  )}
                  {hasCostOverride ? (
                    <p className="mt-1.5 text-[10px] text-amber-600">
                      AI estimate: {formatCurrency(defect.costEstimate!)}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="border-t border-zinc-200" />

            {/* Review metadata */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
                Review status
              </p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-zinc-500">Status</span>
                  <WorkspaceBadge
                    label={defect.reviewedAt ? 'Reviewed' : 'Awaiting review'}
                    tone={defect.reviewedAt ? 'accepted' : 'review'}
                    size="compact"
                  />
                </div>
                {defect.reviewedAt ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-500">Reviewed</span>
                    <span className="text-zinc-700">
                      {new Date(defect.reviewedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                ) : null}
                {defect.reviewedBy ? (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-500">Reviewed by</span>
                    <span className="text-zinc-700">{defect.reviewedBy}</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Footer with keyboard hint ---- */}
        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-3">
          <div className="flex items-center gap-4 text-[10px] text-zinc-400">
            <span>
              <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono text-[9px]">
                Esc
              </kbd>{' '}
              close
            </span>
            {siblingDefects.length > 1 ? (
              <span>
                <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono text-[9px]">
                  ←
                </kbd>{' '}
                <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 py-0.5 font-mono text-[9px]">
                  →
                </kbd>{' '}
                navigate
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
