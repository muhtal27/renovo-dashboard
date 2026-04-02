'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { SupportingDocumentsPanel } from '@/app/(operator)/operator/cases/[id]/_components/supporting-documents-panel'
import { WorkspaceActionButton } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

export function StepEvidence({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status

  const processedDocs = data.documents.filter((d) => d.processingStatus === 'processed')
  const failedDocs = data.documents.filter((d) => d.processingStatus === 'failed')
  const processingDocs = data.documents.filter((d) => d.processingStatus === 'processing')

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
        <h3 className="text-sm font-semibold text-zinc-950">Evidence collection</h3>
        <p className="mt-1 text-sm text-zinc-500">
          {processedDocs.length} processed · {processingDocs.length} processing · {failedDocs.length} failed
          — out of {data.documents.length} total documents.
        </p>
      </section>

      {data.documents.length > 0 ? (
        <div className="overflow-hidden border border-zinc-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Document</th>
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
      ) : (
        <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
      )}

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

      {caseStatus === 'collecting_evidence' ? (
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
