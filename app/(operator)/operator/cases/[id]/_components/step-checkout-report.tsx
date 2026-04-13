'use client'

import { CheckCircle, Circle, ExternalLink, Loader2, Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { SupportingDocumentsPanel } from '@/app/(operator)/operator/cases/[id]/_components/supporting-documents-panel'
import {
  WorkspaceActionButton,
  WorkspaceBadge,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'
import type { CaseWorkspaceReportDocument } from '@/lib/operator-case-workspace-types'

function DocumentRow({
  label,
  linked,
  document,
  required = true,
  pageCount,
}: {
  label: string
  linked: boolean
  document: CaseWorkspaceReportDocument | null
  required?: boolean
  pageCount?: number | null
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-[6px] border px-3.5 py-3 ${
        linked
          ? 'border-emerald-200 bg-emerald-50'
          : 'border-zinc-200 bg-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {linked ? (
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
        ) : (
          <Circle className="h-5 w-5 shrink-0 text-zinc-400" />
        )}
        <div>
          <p className="text-sm font-medium text-zinc-950">{label}</p>
          {linked && document ? (
            <p className="mt-0.5 text-xs text-zinc-500">
              Linked · PDF{pageCount ? ` · ${pageCount} pages` : ''}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-400">
              {required ? 'Required — not yet linked' : 'Optional'}
            </p>
          )}
        </div>
      </div>
      {linked && document ? (
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          Link
        </button>
      )}
    </div>
  )
}

export function StepCheckoutReport({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [, startTransition] = useTransition()

  const caseId = data.workspace.case.id
  const caseStatus = data.workspace.case.status

  const checkIn = data.workspace.reportDocuments.checkIn
  const checkOut = data.workspace.reportDocuments.checkOut
  const tenancyAgreement = data.workspace.reportDocuments.tenancyAgreement

  const requiredLinked = [checkIn, checkOut].filter(Boolean).length
  const hasMinimumReports = Boolean(checkIn) && Boolean(checkOut)

  const processedDocs = data.documents.filter((d) => d.processingStatus === 'processed')
  const failedDocs = data.documents.filter((d) => d.processingStatus === 'failed')
  const processingDocs = data.documents.filter((d) => d.processingStatus === 'processing')

  function getPageCountForReport(report: CaseWorkspaceReportDocument | null): number | null {
    if (!report) return null
    const match = data.documents.find(
      (d) => d.id === report.id || d.documentName === report.fileName
    )
    return match?.pageCount ?? null
  }

  async function handleStartEvidence() {
    setIsTransitioning(true)
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
      toast.success('Evidence collection started')
      startTransition(() => { router.refresh() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update case status.'
      toast.error(msg)
    } finally {
      setIsTransitioning(false)
    }
  }

  async function handleRunAnalysis() {
    setIsTransitioning(true)
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
      toast.success('AI analysis started')
      startTransition(() => { router.refresh() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to update case status.'
      toast.error(msg)
    } finally {
      setIsTransitioning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Core Reports card ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-950">Core Reports</h3>

        {/* Progress row */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
            Progress
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width]"
              style={{ width: `${(requiredLinked / 2) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold tabular-nums text-zinc-500">
            {requiredLinked}/2 required
          </span>
        </div>

        {/* Document list */}
        <div className="space-y-4">
          <DocumentRow
            label="Check-in Report"
            linked={Boolean(checkIn)}
            document={checkIn}
            required
            pageCount={getPageCountForReport(checkIn)}
          />
          <DocumentRow
            label="Checkout Report"
            linked={Boolean(checkOut)}
            document={checkOut}
            required
            pageCount={getPageCountForReport(checkOut)}
          />
          <DocumentRow
            label="Tenancy Agreement"
            linked={Boolean(tenancyAgreement)}
            document={tenancyAgreement}
            required={false}
            pageCount={getPageCountForReport(tenancyAgreement)}
          />
        </div>
      </div>

      {/* ── Uploaded documents section (kept from original) ── */}
      {data.documents.length > 0 ? (
        <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-950">Uploaded documents</h3>
            <div className="flex items-center gap-2">
              {processedDocs.length > 0 ? (
                <WorkspaceBadge label={`${processedDocs.length} processed`} tone="accepted" size="compact" />
              ) : null}
              {processingDocs.length > 0 ? (
                <WorkspaceBadge label={`${processingDocs.length} processing`} tone="processing" size="compact" />
              ) : null}
              {failedDocs.length > 0 ? (
                <WorkspaceBadge label={`${failedDocs.length} failed`} tone="fail" size="compact" />
              ) : null}
            </div>
          </div>
          <div className="mt-3 overflow-x-auto rounded-[6px] border border-zinc-200">
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
                      <div className="flex items-center gap-1.5">
                        {doc.processingStatus === 'processing' ? (
                          <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                        ) : null}
                        <WorkspaceBadge
                          label={formatEnumLabel(doc.processingStatus)}
                          tone={
                            doc.processingStatus === 'processed'
                              ? 'accepted'
                              : doc.processingStatus === 'failed'
                                ? 'fail'
                                : doc.processingStatus === 'processing'
                                  ? 'processing'
                                  : 'neutral'
                          }
                          size="compact"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-600">{doc.pageCount ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{formatDate(doc.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ── Supporting Documents card ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-950">Supporting Documents</h3>
        <p className="mb-4 text-sm text-zinc-500">
          {data.workspace.supportingDocuments.length} file{data.workspace.supportingDocuments.length !== 1 ? 's' : ''} uploaded
        </p>

        {/* Upload area */}
        <div className="mb-4 rounded-[10px] border-2 border-dashed border-zinc-200 px-6 py-6 text-center">
          <Upload className="mx-auto h-5 w-5 text-zinc-400" />
          <p className="mt-2 text-sm text-zinc-600">Drag files here or click to browse</p>
          <p className="mt-1 text-xs text-zinc-400">PDF, JPG, PNG · Max 15 files</p>
        </div>

        <SupportingDocumentsPanel
          caseId={caseId}
          documents={data.workspace.supportingDocuments}
          onRefresh={() => startTransition(() => { router.refresh() })}
        />
      </div>

      {/* ── Transition actions ── */}
      {caseStatus === 'draft' ? (
        <div className="border-t border-zinc-200 pt-6">
          <WorkspaceActionButton
            disabled={!hasMinimumReports || isTransitioning}
            tone="primary"
            title={!hasMinimumReports ? 'Link both check-in and checkout reports to proceed' : undefined}
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
