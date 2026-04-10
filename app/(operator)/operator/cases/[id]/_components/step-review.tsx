'use client'

import { AlertTriangle, Check, Eye, EyeOff, Loader2, RotateCcw, Save, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceNotice,
  WorkspaceOptionButton,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { AIAssistantPanel } from '@/app/(operator)/operator/cases/[id]/_components/ai-assistant-panel'
import { formatCurrency, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { cn } from '@/lib/ui'
import type {
  CheckoutWorkspaceDefectRecord,
  CheckoutWorkspaceLiability,
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

function buildInitialEdits(defects: CheckoutWorkspaceDefectRecord[]): Record<string, DefectEditState> {
  const map: Record<string, DefectEditState> = {}
  for (const d of defects) {
    map[d.id] = {
      operatorLiability: d.operatorLiability ?? d.aiSuggestedLiability,
      costAdjusted: d.costAdjusted ?? d.costEstimate,
      excluded: d.costAdjusted === 0 && d.operatorLiability === null && d.reviewedAt !== null,
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
/*  Defect row                                                         */
/* ------------------------------------------------------------------ */

function DefectRow({
  defect,
  edit,
  isReview,
  onChange,
}: {
  defect: CheckoutWorkspaceDefectRecord
  edit: DefectEditState
  isReview: boolean
  onChange: (id: string, patch: Partial<DefectEditState>) => void
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
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-zinc-950">{defect.itemName}</p>
            <WorkspaceBadge
              label={formatEnumLabel(defect.defectType)}
              size="compact"
              tone={defect.defectType === 'cleaning' ? 'cleaning' : 'maintenance'}
            />
            {edit.excluded ? (
              <WorkspaceBadge label="Excluded" size="compact" tone="neutral" />
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
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

type ReviewTab = 'defects' | 'ai-documents'

export function StepReview({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isSending, setIsSending] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<ReviewTab>('defects')

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isReview = caseStatus === 'review'
  const defects = data.defects
  const recommendations = data.workspace.recommendations
  const issues = data.workspace.issues
  const claim = data.workspace.claim
  const breakdown = data.workspace.claimBreakdown

  const [edits, setEdits] = useState<Record<string, DefectEditState>>(() =>
    buildInitialEdits(defects)
  )

  const handleEditChange = useCallback(
    (id: string, patch: Partial<DefectEditState>) => {
      setEdits((prev) => ({
        ...prev,
        [id]: { ...prev[id], ...patch },
      }))
      setSaveSuccess(false)
    },
    []
  )

  const handleResetAll = useCallback(() => {
    setEdits(buildInitialEdits(defects))
    setSaveSuccess(false)
  }, [defects])

  /* ---- Computed totals ---- */
  const { tenantTotal, landlordTotal, sharedTotal, totalClaim, includedCount, excludedCount } =
    useMemo(() => {
      let tenant = 0
      let landlord = 0
      let shared = 0
      let included = 0
      let excluded = 0

      for (const d of defects) {
        const edit = edits[d.id]
        if (!edit || edit.excluded) {
          excluded++
          continue
        }
        included++
        const cost = edit.costAdjusted ?? d.costEstimate ?? 0
        if (edit.operatorLiability === 'tenant') tenant += cost
        else if (edit.operatorLiability === 'landlord') landlord += cost
        else if (edit.operatorLiability === 'shared') {
          tenant += cost / 2
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
      }
    }, [defects, edits])

  const depositHeld = data.checkoutCase?.depositHeld ?? 0
  const claimExceedsDeposit = depositHeld > 0 && totalClaim > depositHeld

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
    setSaveSuccess(false)
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

      setSaveSuccess(true)
      startTransition(() => {
        router.refresh()
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save overrides.')
    } finally {
      setIsSaving(false)
    }
  }

  /* ---- Send draft ---- */
  async function handleSendDraft() {
    setIsSending(true)
    setError(null)
    try {
      const sendResponse = await fetch(`/api/eot/cases/${caseId}/send-draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!sendResponse.ok) {
        const err = await sendResponse.json().catch(() => null)
        throw new Error(err?.detail || err?.error || 'Failed to send draft emails.')
      }
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
      setError(e instanceof Error ? e.message : 'Failed to send draft.')
    } finally {
      setIsSending(false)
    }
  }

  const aiDraftCount = (data.aiDrafts ?? []).length

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

      {/* ---- Defects section ---- */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-zinc-950">Defects</h3>
            <span className="text-xs text-zinc-400">
              {includedCount} included{excludedCount > 0 ? ` · ${excludedCount} excluded` : ''}
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

        {defects.length > 0 ? (
          <div className="mt-3 space-y-2">
            {defects.map((d) => (
              <DefectRow
                key={d.id}
                defect={d}
                edit={edits[d.id] ?? { operatorLiability: null, costAdjusted: null, excluded: false }}
                isReview={isReview}
                onChange={handleEditChange}
              />
            ))}
          </div>
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
            {saveSuccess ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
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
            {landlordEmail ? ` (${landlordEmail})` : ''} and tenant liabilities to{' '}
            <span className="font-medium text-zinc-950">{tenantName}</span>
            {tenantEmail ? ` (${tenantEmail})` : ''}.
          </p>
          <WorkspaceActionButton
            disabled={!canSend || isSending}
            tone="primary"
            onClick={handleSendDraft}
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
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
    </div>
  )
}
