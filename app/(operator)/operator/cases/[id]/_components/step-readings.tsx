'use client'

import { formatCurrency, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

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

export function StepReadings({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const depositScheme = data.checkoutCase?.depositScheme
  const monthlyRent = data.workspace.overview.monthlyRent
  const rentArrears = data.workspace.overview.rentArrears

  return (
    <div className="space-y-8">
      <Section title="Financial">
        <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
          <div>
            <dt className="text-xs text-zinc-500">Deposit held</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{deposit != null ? formatCurrency(deposit) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Deposit scheme</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{depositScheme ? formatEnumLabel(depositScheme) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Monthly rent</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">{monthlyRent != null ? formatCurrency(monthlyRent) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Rent arrears</dt>
            <dd className="mt-0.5 font-medium text-zinc-950">
              {rentArrears != null && rentArrears > 0 ? (
                <span className="text-rose-700">{formatCurrency(rentArrears)}</span>
              ) : rentArrears != null ? (
                'None'
              ) : (
                '—'
              )}
            </dd>
          </div>
        </dl>
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
            <div>
              <dt className="text-xs text-zinc-500">Zone</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">{data.parking.zone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Permit number</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">{data.parking.permitNumber || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Status</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">{formatEnumLabel(data.parking.status)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No parking details recorded.</p>
        )}
      </Section>

      <Divider />

      <Section title="Council tax">
        {data.councilTax ? (
          <dl className="mt-3 grid grid-cols-2 gap-x-12 gap-y-4 text-sm xl:grid-cols-4">
            <div>
              <dt className="text-xs text-zinc-500">Council</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">{data.councilTax.councilName || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Band</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">{data.councilTax.band || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Council notified</dt>
              <dd className="mt-0.5 font-medium text-zinc-950">
                {data.councilTax.councilNotified ? (
                  <span className="text-emerald-700">
                    Yes{data.councilTax.notifiedAt ? ` — ${formatDate(data.councilTax.notifiedAt)}` : ''}
                  </span>
                ) : (
                  <span className="text-amber-700">No</span>
                )}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No council tax details recorded.</p>
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
    </div>
  )
}
