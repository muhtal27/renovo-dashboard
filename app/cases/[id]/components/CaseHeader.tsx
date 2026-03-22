import Link from 'next/link'
import { formatLabel, formatMoney, getInspectionTone, getWorkflowTone } from '@/app/cases/[id]/workspace-utils'

export function CaseHeader({
  propertyAddress,
  tenantName,
  landlordName,
  depositAmount,
  workflowStatus,
  inspectionStatus,
  caseNumber,
}: {
  propertyAddress: string
  tenantName: string
  landlordName: string
  depositAmount: number | string | null | undefined
  workflowStatus: string | null
  inspectionStatus: string | null
  caseNumber: string | null
}) {
  return (
    <section className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link href="/eot" className="app-kicker inline-flex items-center gap-2 text-stone-500">
            <span aria-hidden="true">←</span>
            Back to cases
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 md:text-4xl">
            {propertyAddress}
          </h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {tenantName} · {landlordName} · {formatMoney(depositAmount)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getWorkflowTone(workflowStatus)}`}>
            {formatLabel(workflowStatus)}
          </span>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getInspectionTone(inspectionStatus)}`}>
            {formatLabel(inspectionStatus)}
          </span>
          <span className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
            {caseNumber || 'Unnumbered case'}
          </span>
        </div>
      </div>
    </section>
  )
}
