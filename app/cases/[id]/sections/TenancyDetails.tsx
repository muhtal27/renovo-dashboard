import type { EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'
import type { ComplianceRecordRow, WorkspaceContact } from '@/app/cases/[id]/workspace-types'
import {
  formatDate,
  formatLabel,
  formatMoney,
  getCertificateLabel,
  getComplianceBadgeTone,
  getContactName,
} from '@/app/cases/[id]/workspace-utils'

function KeyValueTable({
  rows,
}: {
  rows: Array<{ label: string; value: string }>
}) {
  return (
    <dl className="space-y-3 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-start justify-between gap-4">
          <dt className="text-stone-500">{row.label}</dt>
          <dd className="max-w-[60%] text-right text-stone-800">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function TenancyDetails({
  workspace,
  tenant,
  landlord,
  complianceRecords,
}: {
  workspace: EndOfTenancyWorkspacePayload
  tenant: WorkspaceContact | null
  landlord: WorkspaceContact | null
  complianceRecords: ComplianceRecordRow[]
}) {
  return (
    <section id="tenancy" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div>
        <p className="app-kicker">Tenancy details</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Tenancy, property, and compliance context
        </h2>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-stone-900">Tenancy</h3>
          <div className="app-divider my-4" />
          <KeyValueTable
            rows={[
              { label: 'Start date', value: formatDate(workspace.tenancy?.start_date) },
              { label: 'End date', value: formatDate(workspace.tenancy?.end_date) },
              { label: 'Status', value: formatLabel(workspace.tenancy?.tenancy_status || workspace.tenancy?.status) },
              { label: 'Rent amount', value: formatMoney(workspace.tenancy?.rent_amount) },
              { label: 'Deposit amount', value: formatMoney(workspace.tenancy?.deposit_amount) },
              { label: 'Deposit scheme', value: workspace.tenancy?.deposit_scheme_name || 'Not recorded' },
              { label: 'Deposit reference', value: workspace.tenancy?.deposit_reference || 'Not recorded' },
            ]}
          />
        </div>

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-stone-900">Property</h3>
          <div className="app-divider my-4" />
          <KeyValueTable
            rows={[
              { label: 'Address line 1', value: workspace.property?.address_line_1 || 'Not recorded' },
              { label: 'Address line 2', value: workspace.property?.address_line_2 || 'Not recorded' },
              { label: 'City', value: workspace.property?.city || 'Not recorded' },
              { label: 'Postcode', value: workspace.property?.postcode || 'Not recorded' },
              { label: 'Property type', value: formatLabel(workspace.property?.property_type) },
              { label: 'Bedrooms', value: workspace.property?.bedroom_count == null ? 'Not recorded' : String(workspace.property.bedroom_count) },
              { label: 'Bathrooms', value: workspace.property?.bathroom_count == null ? 'Not recorded' : String(workspace.property.bathroom_count) },
              { label: 'Furnishing', value: formatLabel(workspace.property?.furnishing_status) },
            ]}
          />
        </div>

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-stone-900">Tenant</h3>
          <div className="app-divider my-4" />
          <KeyValueTable
            rows={[
              { label: 'Full name', value: getContactName(tenant) },
              { label: 'Email', value: tenant?.email || 'Not recorded' },
              { label: 'Phone', value: tenant?.phone || 'Not recorded' },
            ]}
          />
        </div>

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-stone-900">Landlord</h3>
          <div className="app-divider my-4" />
          <KeyValueTable
            rows={[
              { label: 'Full name', value: getContactName(landlord) },
              { label: 'Email', value: landlord?.email || 'Not recorded' },
              { label: 'Phone', value: landlord?.phone || 'Not recorded' },
            ]}
          />
        </div>

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-stone-900">EOT case</h3>
          <div className="app-divider my-4" />
          <KeyValueTable
            rows={[
              { label: 'Move-out date', value: formatDate(workspace.endOfTenancyCase.move_out_date) },
              { label: 'Inspection date', value: formatDate(workspace.endOfTenancyCase.inspection_date) },
              { label: 'Inspection status', value: formatLabel(workspace.endOfTenancyCase.inspection_status) },
              { label: 'Workflow status', value: formatLabel(workspace.endOfTenancyCase.workflow_status) },
              { label: 'Created', value: formatDate(workspace.endOfTenancyCase.created_at) },
            ]}
          />
        </div>

        <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5 xl:col-span-2">
          <h3 className="text-lg font-semibold text-stone-900">Compliance</h3>
          <div className="app-divider my-4" />
          {complianceRecords.length === 0 ? (
            <p className="text-sm text-stone-500">No compliance records were found for this property.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                    <th className="px-3 py-2">Record type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Issue date</th>
                    <th className="px-3 py-2">Expiry date</th>
                    <th className="px-3 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {complianceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="rounded-l-[1.4rem] border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm font-medium text-stone-900">
                        {getCertificateLabel(record.record_type)}
                      </td>
                      <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getComplianceBadgeTone(record.status)}`}>
                          {formatLabel(record.status)}
                        </span>
                      </td>
                      <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                        {formatDate(record.issue_date)}
                      </td>
                      <td className="border border-r-0 border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                        {formatDate(record.expiry_date)}
                      </td>
                      <td className="rounded-r-[1.4rem] border border-stone-200 bg-white px-3 py-4 text-sm text-stone-700">
                        {record.reference_number || 'Not recorded'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
