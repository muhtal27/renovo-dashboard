'use client'

import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

function Value({ children }: { children: React.ReactNode }) {
  return <dd className="mt-0.5 font-medium text-zinc-950">{children}</dd>
}

function Label({ children }: { children: React.ReactNode }) {
  return <dt className="text-xs text-zinc-500">{children}</dt>
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      <Value>{value || '—'}</Value>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      {children}
    </section>
  )
}

function Divider() {
  return <div className="border-t border-zinc-100" />
}

function PersonTable({
  people,
  emptyText,
}: {
  people: Array<{ id: string; fullName: string | null; email: string | null; phone: string | null }>
  emptyText: string
}) {
  if (people.length === 0) {
    return <p className="mt-2 text-sm text-zinc-500">{emptyText}</p>
  }

  return (
    <div className="mt-3 overflow-hidden border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Name</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Email</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Phone</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className="border-b border-zinc-100 last:border-0">
              <td className="px-4 py-2.5 font-medium text-zinc-950">{p.fullName || '—'}</td>
              <td className="px-4 py-2.5 text-zinc-600">{p.email || '—'}</td>
              <td className="px-4 py-2.5 text-zinc-600">{p.phone || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function StepInventory({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const property = data.workspace.property
  const tenancy = data.workspace.tenancy
  const tenants = data.workspace.overview.tenants
  const landlords = data.workspace.overview.landlords
  const assessor = data.checkoutCase?.assessorName
  const agency = data.checkoutCase?.agencyName
  const checkIn = data.workspace.reportDocuments.checkIn

  const address = [
    property.address_line_1,
    property.address_line_2,
    property.city,
    property.postcode,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-8">
      <Section title="Property">
        <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <Field label="Address" value={address} />
          <Field label="Postcode" value={property.postcode} />
          <Field label="Reference" value={property.reference} />
          <Field label="Country" value={property.country_code?.toUpperCase()} />
        </dl>
      </Section>

      <Divider />

      <Section title="Tenancy">
        <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <Field label="Tenancy start" value={formatDate(tenancy.start_date)} />
          <Field label="Tenancy end" value={formatDate(tenancy.end_date)} />
          <Field label="Check-in date" value={formatDate(data.checkoutCase?.checkinDate)} />
          <Field label="Assessor" value={assessor} />
          <Field label="Agency" value={agency} />
          <Field label="Report source" value={data.checkoutCase?.reportSource} />
        </dl>
      </Section>

      <Divider />

      <Section title="Check-in report">
        {checkIn ? (
          <div className="mt-3 flex items-center gap-3 border border-zinc-200 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-emerald-50 text-emerald-600">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-950">{checkIn.fileName}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {formatDate(checkIn.createdAt)}
                {checkIn.source ? ` · ${checkIn.source}` : ''}
              </p>
            </div>
            <span className="ml-auto text-xs font-medium text-emerald-700">Linked</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No check-in report linked yet.</p>
        )}
      </Section>

      <Divider />

      <Section title="Tenants">
        <PersonTable people={tenants} emptyText="No tenants recorded." />
      </Section>

      <Section title="Landlords">
        <PersonTable people={landlords} emptyText="No landlords recorded." />
      </Section>

      {tenancy.notes ? (
        <>
          <Divider />
          <Section title="Notes">
            <p className="mt-2 text-sm leading-6 text-zinc-600">{tenancy.notes}</p>
          </Section>
        </>
      ) : null}
    </div>
  )
}
