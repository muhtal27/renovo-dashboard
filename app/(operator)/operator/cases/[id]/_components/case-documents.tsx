'use client'

import { useRouter } from 'next/navigation'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { DetailPanel, EmptyState, SectionCard } from '@/app/operator-ui'
import { ReportComparisonCard } from '@/app/(operator)/operator/cases/[id]/_components/report-comparison-card'
import { SupportingDocumentsPanel } from '@/app/(operator)/operator/cases/[id]/_components/supporting-documents-panel'
import {
  WorkspaceBadge,
  WorkspaceMetricCard,
  WorkspaceNotice,
  WorkspaceSectionTitle,
  WorkspaceTable,
  WorkspaceTableCell,
  WorkspaceTableHeaderCell,
  WorkspaceTableRow,
} from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type {
  CheckoutWorkspaceDocumentProcessingStatus,
  OperatorCheckoutWorkspaceData,
} from '@/lib/operator-checkout-workspace-types'
import type { CaseWorkspaceReportDocument } from '@/lib/operator-case-workspace-types'

function getStructuredDocumentStatusTone(status: CheckoutWorkspaceDocumentProcessingStatus) {
  switch (status) {
    case 'processed':
      return 'processed' as const
    case 'processing':
      return 'processing' as const
    case 'failed':
      return 'fail' as const
    case 'uploaded':
    default:
      return 'uploaded' as const
  }
}

function getStructuredDocumentTypeTone(documentType: string) {
  switch (documentType) {
    case 'checkin':
    case 'checkout':
      return 'review' as const
    case 'contractor_quote':
      return 'maintenance' as const
    case 'correspondence':
      return 'info' as const
    default:
      return 'neutral' as const
  }
}

function ReadOnlyLinkedDocumentCard({
  description,
  document,
  label,
}: {
  description: string
  document: CaseWorkspaceReportDocument | null
  label: string
}) {
  if (!document) {
    return (
      <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-3 text-sm font-semibold text-slate-950">Document not linked</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    )
  }

  return (
    <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">
            {document.fileName}
          </p>
        </div>
        <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <WorkspaceBadge label={formatEnumLabel(document.documentType)} tone="neutral" />
        <WorkspaceBadge label={formatEnumLabel(document.source)} tone="info" />
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
      <p className="mt-3 text-sm text-slate-500">Added {formatDate(document.createdAt)}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Open document
          <ExternalLink className="h-4 w-4" />
        </a>
        <a
          href={document.fileUrl}
          download={document.fileName}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Download
          <Download className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

export function CaseDocuments({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const router = useRouter()
  const reportDocumentCount = [
    data.workspace.reportDocuments.checkIn,
    data.workspace.reportDocuments.checkOut,
    data.workspace.reportDocuments.tenancyAgreement,
  ].filter(Boolean).length
  const processedStructuredDocuments = data.documents.filter((document) => {
    return document.processingStatus === 'processed'
  }).length
  const failedStructuredDocuments = data.documents.filter((document) => {
    return document.processingStatus === 'failed'
  }).length
  const caseDocumentLibraryCount = data.workspace.documents.length
  const supportingDocumentCount = data.workspace.supportingDocuments.length

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <WorkspaceMetricCard
          detail="Check-in, check-out, and tenancy agreement coverage."
          label="Evidence pack"
          tone={reportDocumentCount === 3 ? 'success' : 'warning'}
          value={`${reportDocumentCount}/3`}
        />
        <WorkspaceMetricCard
          detail={`${processedStructuredDocuments} processed${failedStructuredDocuments > 0 ? ` · ${failedStructuredDocuments} failed` : ''}`}
          label="Structured checkout docs"
          tone={
            failedStructuredDocuments > 0
              ? 'danger'
              : processedStructuredDocuments === data.documents.length && data.documents.length > 0
                ? 'success'
                : 'info'
          }
          value={data.documents.length}
        />
        <WorkspaceMetricCard
          detail="Files uploaded through the operator workspace."
          label="Supporting documents"
          tone={supportingDocumentCount > 0 ? 'default' : 'warning'}
          value={supportingDocumentCount}
        />
        <WorkspaceMetricCard
          detail="All case documents currently linked to the tenancy review."
          label="Case document library"
          tone={caseDocumentLibraryCount > 0 ? 'default' : 'warning'}
          value={caseDocumentLibraryCount}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <SectionCard className="px-6 py-6 md:px-7">
          <ReportComparisonCard workspace={data.workspace} />
        </SectionCard>

        <DetailPanel
          description="The agreement and import status below show whether the wider evidence pack is ready for document-led review."
          title="Document readiness"
        >
          <WorkspaceNotice
            body={
              reportDocumentCount === 3
                ? 'The evidence pack includes the core reports and tenancy agreement.'
                : 'At least one expected evidence-pack document is still missing from the linked case files.'
            }
            title={reportDocumentCount === 3 ? 'Evidence pack complete' : 'Evidence pack incomplete'}
            tone={reportDocumentCount === 3 ? 'success' : 'warning'}
          />

          <ReadOnlyLinkedDocumentCard
            description="A linked tenancy agreement keeps the checkout evidence pack complete without introducing a new upload flow in this step."
            document={data.workspace.reportDocuments.tenancyAgreement}
            label="Tenancy agreement"
          />
        </DetailPanel>
      </div>

      <SectionCard className="px-6 py-6 md:px-7">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
          <WorkspaceSectionTitle>Structured checkout document inventory</WorkspaceSectionTitle>
          <p className="text-sm leading-6 text-slate-600">
            Files indexed into the structured checkout workspace for processing and later downstream review.
          </p>
        </div>

        <div className="pt-5">
          {data.documents.length > 0 ? (
            <WorkspaceTable>
              <thead>
                <tr>
                  <WorkspaceTableHeaderCell>Document</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Type</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Status</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell>Source</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="center">Pages</WorkspaceTableHeaderCell>
                  <WorkspaceTableHeaderCell align="right">Added</WorkspaceTableHeaderCell>
                </tr>
              </thead>
              <tbody>
                {data.documents.map((document) => (
                  <WorkspaceTableRow key={document.id}>
                    <WorkspaceTableCell emphasis="strong">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950 [overflow-wrap:anywhere]">
                          {document.documentName}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 [overflow-wrap:anywhere]">
                          {document.filePath}
                        </p>
                      </div>
                    </WorkspaceTableCell>
                    <WorkspaceTableCell>
                      <WorkspaceBadge
                        label={formatEnumLabel(document.documentType)}
                        tone={getStructuredDocumentTypeTone(document.documentType)}
                      />
                    </WorkspaceTableCell>
                    <WorkspaceTableCell>
                      <div className="space-y-1">
                        <WorkspaceBadge
                          label={formatEnumLabel(document.processingStatus)}
                          tone={getStructuredDocumentStatusTone(document.processingStatus)}
                        />
                        {document.processedAt ? (
                          <p className="text-xs text-slate-500">Processed {formatDate(document.processedAt)}</p>
                        ) : null}
                      </div>
                    </WorkspaceTableCell>
                    <WorkspaceTableCell>
                      {document.source ? formatTextValue(document.source) : 'Structured import'}
                    </WorkspaceTableCell>
                    <WorkspaceTableCell align="center">
                      {document.pageCount == null ? '—' : document.pageCount}
                    </WorkspaceTableCell>
                    <WorkspaceTableCell align="right">{formatDate(document.createdAt)}</WorkspaceTableCell>
                  </WorkspaceTableRow>
                ))}
              </tbody>
            </WorkspaceTable>
          ) : (
            <EmptyState
              body="Structured checkout files have not been indexed yet. As later flows create and process checkout-specific files, they will appear here with live processing status."
              title="No structured checkout documents yet"
            />
          )}
        </div>
      </SectionCard>

      <SupportingDocumentsPanel
        caseId={data.workspace.case.id}
        documents={data.workspace.supportingDocuments}
        onRefresh={() => router.refresh()}
      />
    </div>
  )
}

function formatTextValue(value: string) {
  const trimmedValue = value.trim()
  return trimmedValue.length > 0 ? trimmedValue : 'Structured import'
}
