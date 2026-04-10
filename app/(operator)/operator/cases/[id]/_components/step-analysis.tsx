'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepAnalysis({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status
  const isAnalysing = caseStatus === 'analysis'
  const isPastAnalysis = ['review', 'draft_sent', 'ready_for_claim', 'submitted', 'resolved', 'disputed'].includes(caseStatus)

  const hasCheckIn = Boolean(data.workspace.reportDocuments.checkIn)
  const hasCheckOut = Boolean(data.workspace.reportDocuments.checkOut)
  const canRun = hasCheckIn && hasCheckOut

  const defectCount = data.defects.length
  const recommendationCount = data.workspace.recommendations.length
  const issueCount = data.workspace.issues.length

  async function handleRunAnalysis() {
    setIsRunning(true)
    setError(null)
    try {
      const response = await fetch(`/api/operator/cases/${caseId}/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || err?.message || 'Analysis failed.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Analysis failed.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">AI analysis</h3>
        {isAnalysing ? (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-amber-500" />
            <p className="text-sm text-zinc-600">
              Analysis is running. The system is comparing check-in and checkout reports to identify
              defects, assign liability, and generate recommendations.
            </p>
          </div>
        ) : isPastAnalysis ? (
          <p className="mt-1 text-sm text-zinc-500">
            Analysis complete. {defectCount} defects identified, {recommendationCount} recommendations
            generated, {issueCount} issues raised.
          </p>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">
            Run AI analysis to compare check-in and checkout reports. The system will identify
            defects, assign liability, and generate claim recommendations.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Report readiness</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">Check-in report</span>
            <span className={hasCheckIn ? 'font-medium text-emerald-700' : 'text-zinc-400'}>
              {hasCheckIn ? 'Linked' : 'Missing'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">Checkout report</span>
            <span className={hasCheckOut ? 'font-medium text-emerald-700' : 'text-zinc-400'}>
              {hasCheckOut ? 'Linked' : 'Missing'}
            </span>
          </div>
        </div>
      </section>

      {isPastAnalysis ? (
        <>
          <section>
            <h3 className="text-sm font-semibold text-zinc-950">Results summary</h3>
            <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
              <div>
                <dt className="text-xs text-zinc-500">Defects</dt>
                <dd className="mt-0.5 font-medium text-zinc-950">{defectCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Recommendations</dt>
                <dd className="mt-0.5 font-medium text-zinc-950">{recommendationCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Issues</dt>
                <dd className="mt-0.5 font-medium text-zinc-950">{issueCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Rooms inspected</dt>
                <dd className="mt-0.5 font-medium text-zinc-950">{data.rooms.length}</dd>
              </div>
            </dl>
          </section>

          {data.rooms.length > 0 ? (
            <section>
              <h3 className="text-sm font-semibold text-zinc-950">Room conditions</h3>
              <div className="mt-3 overflow-hidden border border-zinc-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50/80">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Room</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Check-in</th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Checkout</th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-500">Defects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rooms.map((room) => (
                      <tr key={room.id} className="border-b border-zinc-100 last:border-0">
                        <td className="px-4 py-2.5 font-medium text-zinc-950">{room.roomName}</td>
                        <td className="px-4 py-2.5 text-zinc-600">
                          {room.conditionCheckin ? room.conditionCheckin.charAt(0).toUpperCase() + room.conditionCheckin.slice(1) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-600">
                          {room.conditionCheckout ? room.conditionCheckout.charAt(0).toUpperCase() + room.conditionCheckout.slice(1) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right text-zinc-600">{room.defectCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {(caseStatus === 'analysis' || caseStatus === 'collecting_evidence' || caseStatus === 'review') ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={!canRun || isRunning}
            tone={isPastAnalysis ? 'secondary' : 'primary'}
            onClick={handleRunAnalysis}
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isPastAnalysis ? 'Re-run analysis' : 'Run AI analysis'}
          </WorkspaceActionButton>
          {!canRun ? (
            <p className="mt-2 text-xs text-zinc-500">
              Both check-in and checkout reports must be linked before running analysis.
            </p>
          ) : isPastAnalysis ? (
            <p className="mt-2 text-xs text-zinc-500">
              Re-running will replace existing defects, recommendations, and claims with fresh analysis.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
