'use client'

import { AlertTriangle, Check, CheckCircle2, Loader2, Minus, RefreshCcw, Sparkles, TrendingDown, XCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/app/components/ConfirmDialog'
import {
  ConditionBadge,
  WorkspaceActionButton,
  WorkspaceBadge,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

// Review content (defect table, overrides, notes) is rendered inline beneath
// the analysis summary once analysis is complete — matches the prototype
// "Analysis & Review" merged step. See public/demo.html:2311-2335.
const StepReview = dynamic(() => import('./step-review').then((m) => m.StepReview))

export function StepAnalysis({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showRerunConfirm, setShowRerunConfirm] = useState(false)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isAnalysing = caseStatus === 'analysis'

  useEffect(() => {
    if (!isAnalysing) return
    const interval = setInterval(() => {
      startTransition(() => { router.refresh() })
    }, 8000)
    return () => clearInterval(interval)
  }, [isAnalysing, router, startTransition])

  const isPastAnalysis = ['review', 'draft_sent', 'ready_for_claim', 'submitted', 'resolved', 'disputed'].includes(caseStatus)

  const hasCheckIn = Boolean(data.workspace.reportDocuments.checkIn)
  const hasCheckOut = Boolean(data.workspace.reportDocuments.checkOut)
  const hasTenancyAgreement = Boolean(data.workspace.reportDocuments.tenancyAgreement)
  const canRun = hasCheckIn && hasCheckOut

  const defectCount = data.defects.length
  const roomCount = data.rooms.length
  const totalEstimatedCost = data.defects.reduce((sum, d) => sum + (d.costEstimate ?? 0), 0)
  const roomsWithDefects = new Set(data.defects.map((d) => d.roomId)).size

  const tenantLiabilityCount = data.defects.filter((d) => d.aiSuggestedLiability === 'tenant').length
  const landlordLiabilityCount = data.defects.filter((d) => d.aiSuggestedLiability === 'landlord').length
  const sharedLiabilityCount = data.defects.filter((d) => d.aiSuggestedLiability === 'shared').length
  const totalLiability = tenantLiabilityCount + landlordLiabilityCount + sharedLiabilityCount
  const tenantPct = totalLiability ? Math.round((tenantLiabilityCount / totalLiability) * 100) : 0
  const sharedPct = totalLiability ? Math.round((sharedLiabilityCount / totalLiability) * 100) : 0
  const landlordPct = totalLiability ? 100 - tenantPct - sharedPct : 0

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

  /* ── State: Analysis Complete ── */
  if (isPastAnalysis) {
    return (
      <div className="space-y-4">
        {/* Success banner */}
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5" style={{ borderLeftWidth: 3, borderLeftColor: '#10b981' }}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-emerald-700">AI Analysis Complete</div>
              <div className="text-[13px] text-zinc-500">
                {defectCount} defects identified across {roomsWithDefects} rooms
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRerunConfirm(true)}
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Re-run
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <div className="text-xs font-medium text-zinc-500">Defects Found</div>
            <div className="mt-2 text-[28px] font-bold leading-none tabular-nums text-zinc-900">{defectCount}</div>
          </div>
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <div className="text-xs font-medium text-zinc-500">Estimated Cost</div>
            <div className="mt-2 text-[28px] font-bold leading-none tabular-nums text-emerald-600">{formatCurrency(totalEstimatedCost)}</div>
          </div>
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <div className="text-xs font-medium text-zinc-500">Rooms Affected</div>
            <div className="mt-2 text-[28px] font-bold leading-none tabular-nums text-zinc-900">
              {roomsWithDefects}<span className="text-sm font-normal text-zinc-500">/{roomCount}</span>
            </div>
          </div>
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <div className="text-xs font-medium text-zinc-500">AI Confidence</div>
            <div className="mt-2 text-[28px] font-bold leading-none tabular-nums text-zinc-900">—</div>
          </div>
        </div>

        {/* Room Conditions */}
        {data.rooms.length > 0 ? (
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <h4 className="mb-3 text-sm font-semibold text-zinc-900">Room Conditions</h4>
            <div className="overflow-hidden rounded-[10px] border border-zinc-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Room</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Check-in</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Checkout</th>
                    <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Change</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Defects</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rooms.map((room) => {
                    const hasDeclined = room.conditionCheckin && room.conditionCheckout && room.conditionCheckin !== room.conditionCheckout
                    return (
                      <tr key={room.id} className="border-t border-zinc-100 transition hover:bg-zinc-50">
                        <td className="px-4 py-3 text-[13px] font-medium text-zinc-900">{room.roomName}</td>
                        <td className="px-4 py-3"><ConditionBadge value={room.conditionCheckin} /></td>
                        <td className="px-4 py-3"><ConditionBadge value={room.conditionCheckout} /></td>
                        <td className="px-4 py-3">
                          {hasDeclined ? (
                            <span className="text-rose-600"><TrendingDown className="h-3.5 w-3.5" /></span>
                          ) : (
                            <span className="text-emerald-600"><Minus className="h-3.5 w-3.5" /></span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-[13px] tabular-nums font-semibold">
                          {room.defectCount > 0 ? room.defectCount : <span className="text-zinc-400">—</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Liability Breakdown */}
        {totalLiability > 0 ? (
          <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
            <h4 className="mb-3 text-sm font-semibold text-zinc-900">Liability Breakdown</h4>
            <div className="flex gap-4">
              {[
                { label: 'Tenant', pct: tenantPct, color: 'bg-rose-500', textColor: 'text-rose-500' },
                { label: 'Shared', pct: sharedPct, color: 'bg-amber-500', textColor: 'text-amber-500' },
                { label: 'Landlord', pct: landlordPct, color: 'bg-sky-500', textColor: 'text-sky-500' },
              ].map((item) => (
                <div key={item.label} className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">{item.label}</span>
                  </div>
                  <div className="mt-1 text-xl font-bold tabular-nums">{item.pct}%</div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}

        {/* Merged Review content — prototype demo.html:2311 "Analysis & Review". */}
        <StepReview data={data} />

        <ConfirmDialog
          open={showRerunConfirm}
          title="Re-run AI analysis?"
          description={`This will replace all ${defectCount} existing defects and claims with a fresh analysis. Any manual overrides in the review step will be lost. This action cannot be undone.`}
          confirmLabel="Re-run analysis"
          cancelLabel="Cancel"
          tone="danger"
          onConfirm={handleRunAnalysis}
          onCancel={() => setShowRerunConfirm(false)}
        />
      </div>
    )
  }

  /* ── State: Analysing (running) ── */
  if (isAnalysing) {
    return (
      <div className="space-y-4">
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <h3 className="mb-4 text-base font-semibold text-zinc-900">AI Analysis Engine</h3>
          <div className="rounded-[10px] border border-emerald-200 p-5" style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0f9ff)' }}>
            <div className="mb-5 flex items-center gap-2.5">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
              <div>
                <div className="text-sm font-semibold text-emerald-700">Analysing documents...</div>
                <div className="text-[13px] text-zinc-500">This usually takes 10–15 seconds</div>
              </div>
            </div>
            <div className="mb-5 h-1 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-500" />
            </div>
            <div className="space-y-4">
              {[
                { label: 'Scanning uploaded documents', desc: 'Reading check-in and checkout reports...' },
                { label: 'Identifying defects and issues', desc: 'Comparing room conditions between reports...' },
                { label: 'Assessing severity and liability', desc: 'Applying fair wear and tear guidelines...' },
                { label: 'Generating recommendations', desc: 'Creating claim recommendations and cost estimates...' },
              ].map((stage, i) => (
                <div key={stage.label} className="flex items-start gap-2.5">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                    {i === 0 ? <Loader2 className="h-3 w-3 animate-spin" /> : <span className="h-2 w-2 rounded-full bg-current" />}
                  </div>
                  <div>
                    <div className={`text-[13px] font-medium ${i === 0 ? 'text-emerald-700' : 'text-zinc-400'}`}>{stage.label}</div>
                    <div className={`text-[11px] ${i === 0 ? 'text-emerald-600' : 'text-zinc-400'}`}>{stage.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── State: Ready to Analyse ── */
  return (
    <div className="space-y-4">
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-base font-semibold text-zinc-900">AI Analysis Engine</h3>

        {/* Readiness Checklist */}
        <div className="mb-4 rounded-[10px] border border-zinc-200 bg-zinc-50 p-4">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            Readiness Checklist
          </div>
          {[
            { label: 'Check-in report linked', ready: hasCheckIn },
            { label: 'Checkout report linked', ready: hasCheckOut },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 py-1">
              <CheckCircle2 className={`h-4 w-4 ${item.ready ? 'text-emerald-600' : 'text-zinc-300'}`} />
              <span className="text-[13px] text-zinc-700">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 py-1">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${hasTenancyAgreement ? 'border-emerald-400 text-emerald-600' : 'border-zinc-300 text-zinc-400'}`}>
              {hasTenancyAgreement ? <Check className="h-2.5 w-2.5" /> : null}
            </span>
            <span className="text-[13px] text-zinc-500">Tenancy agreement (optional)</span>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-[10px] border border-emerald-200 p-6 text-center" style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0f9ff)' }}>
          <div className="mb-2 text-emerald-600">
            <Sparkles className="mx-auto h-7 w-7" />
          </div>
          <h4 className="text-sm font-semibold text-zinc-900">Ready to Analyse</h4>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-zinc-500">
            Renovo AI will scan your documents, identify defects, assess severity, and recommend liability for each issue.
          </p>
          <button
            type="button"
            disabled={!canRun || isRunning}
            onClick={handleRunAnalysis}
            className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] border border-emerald-600 bg-emerald-600 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Run AI Analysis
          </button>
        </div>

        {!canRun ? (
          <p className="mt-3 text-xs text-zinc-500">
            Both check-in and checkout reports must be linked before running analysis.
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-rose-700" role="alert">{error}</p> : null}
    </div>
  )
}
