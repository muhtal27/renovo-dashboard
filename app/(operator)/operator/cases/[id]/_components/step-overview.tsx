'use client'

import { formatCurrency, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
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

export function StepOverview({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const property = data.workspace.property
  const tenancy = data.workspace.tenancy
  const tenants = data.workspace.overview.tenants
  const landlords = data.workspace.overview.landlords
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const depositScheme = data.checkoutCase?.depositScheme
  const monthlyRent = data.workspace.overview.monthlyRent
  const rentArrears = data.workspace.overview.rentArrears
  const checkoutDate = data.checkoutCase?.checkoutDate ?? tenancy.end_date
  const assessor = data.checkoutCase?.assessorName
  const agency = data.checkoutCase?.agencyName

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
          <Field label="Checkout date" value={formatDate(checkoutDate)} />
          <Field label="Check-in date" value={formatDate(data.checkoutCase?.checkinDate)} />
          <Field label="Assessor" value={assessor} />
          <Field label="Agency" value={agency} />
          <Field label="Report source" value={data.checkoutCase?.reportSource} />
        </dl>
      </Section>

      <Divider />

      <Section title="Tenants">
        <PersonTable people={tenants} emptyText="No tenants recorded." />
      </Section>

      <Section title="Landlords">
        <PersonTable people={landlords} emptyText="No landlords recorded." />
      </Section>

      <Divider />

      <Section title="Financial">
        <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <Field label="Deposit held" value={deposit != null ? formatCurrency(deposit) : null} />
          <Field label="Deposit scheme" value={depositScheme ? formatEnumLabel(depositScheme) : null} />
          <Field label="Monthly rent" value={monthlyRent != null ? formatCurrency(monthlyRent) : null} />
          <Field
            label="Rent arrears"
            value={
              rentArrears != null && rentArrears > 0 ? (
                <span className="text-rose-700">{formatCurrency(rentArrears)}</span>
              ) : rentArrears != null ? (
                'None'
              ) : null
            }
          />
        </dl>
      </Section>

      <Divider />

      <Section title="Keys">
        {data.keys.length > 0 ? (
          <div className="mt-3 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Set</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Count</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Status</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.keys.map((k) => (
                  <tr key={k.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-zinc-950">{k.setName}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{k.keyCount}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={
                          k.status === 'returned'
                            ? 'text-emerald-700'
                            : k.status === 'outstanding'
                              ? 'text-rose-700'
                              : 'text-zinc-500'
                        }
                      >
                        {formatEnumLabel(k.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-zinc-500">{k.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No key records.</p>
        )}
      </Section>

      <Divider />

      <Section title="Parking">
        {data.parking ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
            <Field label="Zone" value={data.parking.zone} />
            <Field label="Permit number" value={data.parking.permitNumber} />
            <Field label="Status" value={formatEnumLabel(data.parking.status)} />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No parking details recorded.</p>
        )}
      </Section>

      <Divider />

      <Section title="Utilities">
        {data.utilities.length > 0 ? (
          <div className="mt-3 overflow-hidden border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Check-in reading</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Checkout reading</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Usage</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Meter location</th>
                </tr>
              </thead>
              <tbody>
                {data.utilities.map((u) => (
                  <tr key={u.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-zinc-950">{formatEnumLabel(u.utilityType)}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{u.readingCheckin ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{u.readingCheckout ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-600">{u.usageCalculated ?? '—'}</td>
                    <td className="px-4 py-2.5 text-zinc-500">{u.meterLocation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No utility readings recorded.</p>
        )}
      </Section>

      <Divider />

      <Section title="Safety and compliance">
        {data.detectors.length > 0 ? (
          <>
            <p className="mt-2 text-xs font-medium text-zinc-500">Detectors</p>
            <div className="mt-2 overflow-hidden border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Location</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Tested</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {data.detectors.map((d) => (
                    <tr key={d.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-zinc-950">{formatEnumLabel(d.detectorType)}</td>
                      <td className="px-4 py-2.5 text-zinc-600">{d.location}</td>
                      <td className="px-4 py-2.5">
                        <span className={d.tested ? 'text-emerald-700' : 'text-rose-700'}>
                          {d.tested ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500">{formatDate(d.expiryDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {data.compliance.length > 0 ? (
          <>
            <p className="mt-4 text-xs font-medium text-zinc-500">Compliance checks</p>
            <div className="mt-2 overflow-hidden border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Item</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Passed</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compliance.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-zinc-950">{c.checkItem}</td>
                      <td className="px-4 py-2.5">
                        {c.passed === true ? (
                          <span className="text-emerald-700">Yes</span>
                        ) : c.passed === false ? (
                          <span className="text-rose-700">No</span>
                        ) : (
                          <span className="text-zinc-400">Not assessed</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-zinc-500">{c.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}

        {data.detectors.length === 0 && data.compliance.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-500">No safety or compliance records.</p>
        ) : null}
      </Section>

      <Divider />

      <Section title="Council tax">
        {data.councilTax ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
            <Field label="Council" value={data.councilTax.councilName} />
            <Field label="Band" value={data.councilTax.band} />
            <Field
              label="Council notified"
              value={
                data.councilTax.councilNotified ? (
                  <span className="text-emerald-700">
                    Yes{data.councilTax.notifiedAt ? ` — ${formatDate(data.councilTax.notifiedAt)}` : ''}
                  </span>
                ) : (
                  <span className="text-amber-700">No</span>
                )
              }
            />
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No council tax details recorded.</p>
        )}
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
