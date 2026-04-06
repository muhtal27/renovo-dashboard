'use client'

import { Check, FileText, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SupportingDocumentsPanel } from '@/app/(operator)/operator/cases/[id]/_components/supporting-documents-panel'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

function DocumentRow({
  label,
  linked,
  document,
}: {
  label: string
  linked: boolean
  document: { name: string; date: string | null; source: string | null } | null
}) {
  return (
    <div className="flex items-start justify-between border-b border-zinc-100 py-4 last:border-0">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded ${
            linked ? 'bg-emerald-50 text-emerald-600' : 'bg-zinc-100 text-zinc-400'
          }`}
        >
          {linked ? <Check className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-950">{label}</p>
          {document ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              {document.name}
              {document.date ? ` · ${formatDate(document.date)}` : ''}
              {document.source ? ` · ${document.source}` : ''}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-400">Not linked</p>
          )}
        </div>
      </div>
      <span
        className={`text-xs font-medium ${linked ? 'text-emerald-700' : 'text-zinc-400'}`}
      >
        {linked ? 'Linked' : 'Missing'}
      </span>
    </div>
  )
}

export function StepCheckoutReport({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status

  const checkIn = data.workspace.reportDocuments.checkIn
  const checkOut = data.workspace.reportDocuments.checkOut
  const tenancyAgreement = data.workspace.reportDocuments.tenancyAgreement

  const linkedCount = [checkIn, checkOut, tenancyAgreement].filter(Boolean).length
  const hasMinimumReports = Boolean(checkIn) && Boolean(checkOut)

  const processedDocs = data.documents.filter((d) => d.processingStatus === 'processed')
  const failedDocs = data.documents.filter((d) => d.processingStatus === 'failed')
  const processingDocs = data.documents.filter((d) => d.processingStatus === 'processing')

  async function handleStartEvidence() {
    setIsTransitioning(true)
    setError(null)
    try {
      const response = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'collecting_evidence' }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Failed to update case status.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update case status.')
    } finally {
      setIsTransitioning(false)
    }
  }

  async function handleRunAnalysis() {
    setIsTransitioning(true)
    setError(null)
    try {
      const response = await fetch(`/api/eot/cases/${caseId}/transition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'analysis' }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => null)
        throw new Error(err?.detail || 'Failed to update case status.')
      }
      startTransition(() => { router.refresh() })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update case status.')
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Core reports</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {linkedCount}/3 reports linked. Both check-in and check-out reports are required before
          analysis can begin.
        </p>
      </section>

      <div className="border border-zinc-200">
        <DocumentRow
          label="Check-in report"
          linked={Boolean(checkIn)}
          document={
            checkIn
              ? { name: checkIn.fileName, date: checkIn.createdAt, source: checkIn.source }
              : null
          }
        />
        <DocumentRow
          label="Checkout report"
          linked={Boolean(checkOut)}
          document={
            checkOut
              ? { name: checkOut.fileName, date: checkOut.createdAt, source: checkOut.source }
              : null
          }
        />
        <DocumentRow
          label="Tenancy agreement"
          linked={Boolean(tenancyAgreement)}
          document={
            tenancyAgreement
              ? { name: tenancyAgreement.fileName, date: tenancyAgreement.createdAt, source: tenancyAgreement.source }
              : null
          }
        />
      </div>

      {data.documents.length > 0 ? (
        <section>
          <h3 className="text-sm font-semibold text-zinc-950">Uploaded documents</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {processedDocs.length} processed · {processingDocs.length} processing · {failedDocs.length} failed
          </p>
          <div className="mt-3 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Pages</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Added</th>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-zinc-950">{doc.documentName}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{formatEnumLabel(doc.documentType)}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          doc.processingStatus === 'processed'
                            ? 'text-emerald-700'
                            : doc.processingStatus === 'failed'
                              ? 'text-rose-700'
                              : doc.processingStatus === 'processing'
                                ? 'text-amber-700'
                                : 'text-zinc-500'
                        }
                      >
                        {formatEnumLabel(doc.processingStatus)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">{doc.pageCount ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{formatDate(doc.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="text-sm font-semibold text-zinc-950">Supporting documents</h3>
        <div className="mt-3">
          <SupportingDocumentsPanel
            caseId={caseId}
            documents={data.workspace.supportingDocuments}
            onRefresh={() => startTransition(() => { router.refresh() })}
          />
        </div>
      </section>

      {error ? (
        <p className="text-sm text-rose-700">{error}</p>
      ) : null}

      {caseStatus === 'draft' ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={!hasMinimumReports || isTransitioning}
            tone="primary"
            onClick={handleStartEvidence}
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Start collecting evidence
          </WorkspaceActionButton>
          {!hasMinimumReports ? (
            <p className="mt-2 text-xs text-zinc-500">
              Link both check-in and checkout reports to proceed.
            </p>
          ) : null}
        </div>
      ) : caseStatus === 'collecting_evidence' ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={isTransitioning}
            tone="primary"
            onClick={handleRunAnalysis}
          >
            {isTransitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Start AI analysis
          </WorkspaceActionButton>
        </div>
      ) : null}
    </div>
  )
}
