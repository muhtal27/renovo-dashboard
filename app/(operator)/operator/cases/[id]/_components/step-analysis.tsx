'use client'

import { AlertTriangle, Check, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import {
  ConditionBadge,
  WorkspaceActionButton,
  WorkspaceBadge,
  WorkspaceNotice,
  WorkspaceProgressBar,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepAnalysis({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showRerunConfirm, setShowRerunConfirm] = useState(false)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isAnalysing = caseStatus === 'analysis'
  const isPastAnalysis = ['review', 'draft_sent', 'ready_for_claim', 'submitted', 'resolved', 'disputed'].includes(caseStatus)

  const hasCheckIn = Boolean(data.workspace.reportDocuments.checkIn)
  const hasCheckOut = Boolean(data.workspace.reportDocuments.checkOut)
  const hasTenancyAgreement = Boolean(data.workspace.reportDocuments.tenancyAgreement)
  const canRun = hasCheckIn && hasCheckOut

  const defectCount = data.defects.length
  const recommendationCount = data.workspace.recommendations.length
  const issueCount = data.workspace.issues.length
  const roomCount = data.rooms.length

  const totalEstimatedCost = data.defects.reduce((sum, d) => sum + (d.costEstimate ?? 0), 0)
  const tenantLiabilityCount = data.defects.filter((d) => d.aiSuggestedLiability === 'tenant').length
  const landlordLiabilityCount = data.defects.filter((d) => d.aiSuggestedLiability === 'landlord').length
  const sharedLiabilityCount = data.defects.filter((d) => d.aiSuggestedLiability === 'shared').length

  async function handleRunAnalysis() {
    setIsRunning(true)
    setError(null)
    setShowRerunConfirm(false)
    try {
      const response = await fetch(`/api/operator/cases/${caseId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || err?.message || 'Analysis failed.')
      }
      toast.success(isPastAnalysis ? 'Re-analysis started successfully' : 'Analysis started successfully')
      startTransition(() => { router.refresh() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Analysis failed.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsRunning(false)
    }
  }

  const readinessItems = [
    { label: 'Check-in report', ready: hasCheckIn, required: true },
    { label: 'Checkout report', ready: hasCheckOut, required: true },
    { label: 'Tenancy agreement', ready: hasTenancyAgreement, required: false },
  ]
  const readinessScore = readinessItems.filter((i) => i.ready).length
  const requiredReady = readinessItems.filter((i) => i.required && i.ready).length
  const requiredTotal = readinessItems.filter((i) => i.required).length

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">AI analysis</h3>
        {isAnalysing ? (
          <WorkspaceNotice
            tone="warning"
            icon={
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-amber-400 opacity-40" />
                <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              </div>
            }
            title="Analysis in progress"
            body="The system is comparing check-in and checkout reports to identify defects, assign liability, and generate recommendations. This may take a few minutes."
          />
        ) : isPastAnalysis ? (
          <WorkspaceNotice
            tone="success"
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Analysis complete"
            body={`${defectCount} defects identified, ${recommendationCount} recommendations generated, ${issueCount} issues raised across ${roomCount} rooms.`}
          />
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            Run AI analysis to compare check-in and checkout reports. The system will identify
            defects, assign liability, and generate claim recommendations.
          </p>
        )}
      </section>

      {/* Report readiness checklist */}
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Report readiness</h3>
          <span className="text-xs tabular-nums text-zinc-400">
            {readinessScore}/{readinessItems.length} linked
          </span>
        </div>
        <div className="mt-2">
          <WorkspaceProgressBar
            value={requiredReady}
            max={requiredTotal}
            tone={requiredReady === requiredTotal ? 'success' : 'warning'}
            showPercentage={false}
          />
        </div>
        <div className="mt-3 space-y-1">
          {readinessItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between border-b border-zinc-50 py-2 last:border-0">
              <div className="flex items-center gap-2">
                {item.ready ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-300" />
                )}
                <span className="text-sm text-zinc-600">{item.label}</span>
                {!item.required ? (
                  <span className="text-[10px] text-zinc-400">(optional)</span>
                ) : null}
              </div>
              <WorkspaceBadge
                label={item.ready ? 'Linked' : 'Missing'}
                tone={item.ready ? 'accepted' : item.required ? 'fail' : 'neutral'}
                size="compact"
              />
            </div>
          ))}
        </div>
      </section>

      {isPastAnalysis ? (
        <>
          {/* Results metrics */}
          <section>
            <h3 className="text-sm font-semibold text-zinc-950">Results summary</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Defects</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">{defectCount}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {tenantLiabilityCount > 0 ? (
                    <span className="text-[10px] text-fuchsia-600">{tenantLiabilityCount} tenant</span>
                  ) : null}
                  {landlordLiabilityCount > 0 ? (
                    <span className="text-[10px] text-sky-600">{landlordLiabilityCount > 0 && tenantLiabilityCount > 0 ? ' · ' : ''}{landlordLiabilityCount} landlord</span>
                  ) : null}
                  {sharedLiabilityCount > 0 ? (
                    <span className="text-[10px] text-orange-600">{(tenantLiabilityCount > 0 || landlordLiabilityCount > 0) ? ' · ' : ''}{sharedLiabilityCount} shared</span>
                  ) : null}
                </div>
              </div>
              <div className="border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Estimated cost</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">{formatCurrency(totalEstimatedCost)}</p>
              </div>
              <div className="border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Recommendations</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">{recommendationCount}</p>
                <p className="mt-1 text-[10px] text-zinc-400">{issueCount} issues raised</p>
              </div>
              <div className="border border-zinc-200 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">Rooms</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-950">{roomCount}</p>
              </div>
            </div>
          </section>

          {/* Room conditions table with ConditionBadge */}
          {data.rooms.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-zinc-950">Room conditions</h3>
              <div className="mt-3 overflow-x-auto border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Room</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Check-in</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Checkout</th>
                      <th className="px-4 py-2.5 text-center text-xs font-medium text-zinc-500">Change</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Defects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rooms.map((room) => {
                      const hasDeclined =
                        room.conditionCheckin && room.conditionCheckout &&
                        room.conditionCheckin !== room.conditionCheckout
                      return (
                        <tr key={room.id} className="border-b border-zinc-100 last:border-0">
                          <td className="px-4 py-2.5 font-medium text-zinc-950">{room.roomName}</td>
                          <td className="px-4 py-2.5">
                            <ConditionBadge value={room.conditionCheckin} />
                          </td>
                          <td className="px-4 py-2.5">
                            <ConditionBadge value={room.conditionCheckout} />
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {hasDeclined ? (
                              <WorkspaceBadge label="Declined" tone="warning" size="compact" />
                            ) : room.conditionCheckin && room.conditionCheckout ? (
                              <WorkspaceBadge label="No change" tone="accepted" size="compact" />
                            ) : (
                              <span className="text-xs text-zinc-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {room.defectCount > 0 ? (
                              <span className="font-medium text-zinc-950">{room.defectCount}</span>
                            ) : (
                              <span className="text-zinc-400">0</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}

      {/* Action buttons */}
      {(caseStatus === 'analysis' || caseStatus === 'collecting_evidence' || caseStatus === 'review') ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={!canRun || isRunning}
            tone={isPastAnalysis ? 'secondary' : 'primary'}
            onClick={isPastAnalysis ? () => setShowRerunConfirm(true) : handleRunAnalysis}
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPastAnalysis ? 'Re-run analysis' : 'Run AI analysis'}
          </WorkspaceActionButton>
          {!canRun ? (
            <p className="mt-2 text-xs text-zinc-500">
              Both check-in and checkout reports must be linked before running analysis.
            </p>
          ) : isPastAnalysis ? (
            <p className="mt-2 text-xs text-amber-600">
              <AlertTriangle className="mr-1 inline-block h-3 w-3" />
              Re-running will replace existing defects, recommendations, and claims with fresh analysis.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Re-run confirmation dialog */}
      <ConfirmDialog
        open={showRerunConfirm}
        title="Re-run AI analysis?"
        description={`This will replace all ${defectCount} existing defects, ${recommendationCount} recommendations, and claims with a fresh analysis. Any manual overrides in the review step will be lost. This action cannot be undone.`}
        confirmLabel="Re-run analysis"
        cancelLabel="Cancel"
        tone="danger"
        onConfirm={handleRunAnalysis}
        onCancel={() => setShowRerunConfirm(false)}
      />
    </div>
  )
}
