import { ExternalLink, FileText } from 'lucide-react'
import { EmptyState } from '@/app/operator-ui'
import { StatusBadge, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type {
  CaseWorkspaceReportDocument,
  OperatorCaseWorkspaceData,
} from '@/lib/operator-case-workspace-types'

function ReportDocumentPane({
  label,
  document,
}: {
  label: string
  document: CaseWorkspaceReportDocument | null
}) {
  if (!document) {
    return (
      <div className="rounded-[18px] border border-dashed border-slate-300 bg-slate-50/70 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-3 text-sm font-semibold text-slate-950">Document not available</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Seeded evidence has not linked a {label.toLowerCase()} document yet.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500"
        >
          Preview
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-[18px] border border-slate-200 px-5 py-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-3 text-sm font-semibold text-slate-950 [overflow-wrap:anywhere]">{document.fileName}</p>
        </div>
        <FileText className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge label={formatEnumLabel(document.documentType)} tone="document" />
        <StatusBadge label={formatEnumLabel(document.source)} tone="document" />
      </div>

      <p className="mt-4 text-sm text-slate-600">Created {formatDate(document.createdAt)}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center rounded-[14px] border border-slate-200 bg-slate-100 px-4 text-sm font-medium text-slate-500"
        >
          Preview
        </button>
        <a
          href={document.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-[14px] border border-slate-900 bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Download
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

export function ReportComparisonCard({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  const reportCount =
    Number(Boolean(workspace.reportDocuments.checkIn)) +
    Number(Boolean(workspace.reportDocuments.checkOut)) +
    Number(Boolean(workspace.reportDocuments.tenancyAgreement))

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-[-0.02em] text-slate-950">Core documents</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review the tenancy agreement alongside check-in and check-out records from the same file.
          </p>
        </div>
        <StatusBadge label={`${reportCount}/3 documents found`} tone={reportCount === 3 ? 'stable' : 'attention'} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        <ReportDocumentPane
          label="Tenancy agreement"
          document={workspace.reportDocuments.tenancyAgreement}
        />
        <ReportDocumentPane label="Check-in document" document={workspace.reportDocuments.checkIn} />
        <ReportDocumentPane label="Check-out document" document={workspace.reportDocuments.checkOut} />
      </div>

      {workspace.documents.length === 0 && workspace.evidence.length === 0 ? (
        <EmptyState
          title="No case evidence available"
          body="This workspace has not received documents or supporting evidence yet."
          className="mt-5"
        />
      ) : null}
    </div>
  )
}
