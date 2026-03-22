import type { ComplianceRecordRow, WorkspaceContact } from '@/app/cases/[id]/workspace-types'
import {
  buildAddress,
  formatDate,
  formatLabel,
  formatMoney,
  getCertificateLabel,
  getComplianceTone,
  getContactName,
  getRecommendationProgressLabel,
  getRecommendationProgressStep,
} from '@/app/cases/[id]/workspace-utils'

function ComplianceSnapshot({
  records,
}: {
  records: ComplianceRecordRow[]
}) {
  const recordTypes = ['gas_safety', 'electrical_installation', 'epc', 'legionella']

  return (
    <div className="space-y-3">
      {recordTypes.map((recordType) => {
        const record = records.find((item) => item.record_type === recordType) ?? null
        const status = record?.status ?? 'missing'

        return (
          <div key={recordType} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-stone-600">{getCertificateLabel(recordType)}</span>
            <span className={`font-medium ${getComplianceTone(status)}`}>
              {formatLabel(status)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function ContextRail({
  tenant,
  landlord,
  tenancy,
  property,
  workflowStatus,
  moveOutDate,
  inspectionStatus,
  complianceRecords,
}: {
  tenant: WorkspaceContact | null
  landlord: WorkspaceContact | null
  tenancy: {
    start_date: string | null
    end_date: string | null
    rent_amount: number | string | null
    deposit_amount: number | string | null
    deposit_scheme_name?: string | null
  } | null
  property: {
    address_line_1: string | null
    address_line_2?: string | null
    city?: string | null
    postcode?: string | null
    property_type?: string | null
    furnishing_status?: string | null
  } | null
  workflowStatus: string | null
  moveOutDate: string | null
  inspectionStatus: string | null
  complianceRecords: ComplianceRecordRow[]
}) {
  const progressStep = getRecommendationProgressStep(workflowStatus)

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <section className="app-surface rounded-[1.8rem] p-5">
        <p className="app-kicker">Tenancy</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">Tenant</dt>
            <dd className="text-right font-medium text-stone-900">{getContactName(tenant)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">Landlord</dt>
            <dd className="text-right font-medium text-stone-900">{getContactName(landlord)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">Start date</dt>
            <dd className="text-right text-stone-700">{formatDate(tenancy?.start_date)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">End date</dt>
            <dd className="text-right text-stone-700">{formatDate(tenancy?.end_date)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">Rent</dt>
            <dd className="text-right text-stone-700">{formatMoney(tenancy?.rent_amount)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">Deposit</dt>
            <dd className="text-right text-stone-700">{formatMoney(tenancy?.deposit_amount)}</dd>
          </div>
          <div className="flex items-start justify-between gap-3">
            <dt className="text-stone-500">Scheme</dt>
            <dd className="text-right text-stone-700">
              {tenancy?.deposit_scheme_name || 'Not recorded'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="app-surface rounded-[1.8rem] p-5">
        <p className="app-kicker">Property</p>
        <div className="mt-4 space-y-3 text-sm text-stone-700">
          <p className="font-medium text-stone-900">{buildAddress(property)}</p>
          <p>{formatLabel(property?.property_type)}</p>
          <p>{formatLabel(property?.furnishing_status)}</p>
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-5">
        <p className="app-kicker">EOT status</p>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-stone-600">
              <span>Workflow step</span>
              <span className="font-medium text-stone-900">
                {getRecommendationProgressLabel(progressStep)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-stone-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(progressStep / 5) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-stone-500">Move-out date</span>
            <span className="text-right text-stone-700">{formatDate(moveOutDate)}</span>
          </div>
          <div className="flex items-start justify-between gap-3 text-sm">
            <span className="text-stone-500">Inspection</span>
            <span className="text-right text-stone-700">{formatLabel(inspectionStatus)}</span>
          </div>
        </div>
      </section>

      <section className="app-surface rounded-[1.8rem] p-5">
        <p className="app-kicker">Compliance snapshot</p>
        <div className="app-divider my-4" />
        <ComplianceSnapshot records={complianceRecords} />
      </section>
    </aside>
  )
}
