'use client'

import { Info } from 'lucide-react'
import { WorkspaceBadge, WorkspaceNotice } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatCurrency, formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

function Section({ title, badge, children }: { title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
        {badge ?? null}
      </div>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-zinc-950">{value || '—'}</dd>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-zinc-100" />
}

/** Map utility type to its expected unit */
function getUtilityUnit(type: string): string {
  const normalized = type.toLowerCase()
  if (normalized.includes('electric')) return 'kWh'
  if (normalized.includes('gas')) return 'm³'
  if (normalized.includes('water')) return 'm³'
  if (normalized.includes('oil')) return 'litres'
  return ''
}

export function StepReadings({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const deposit = data.checkoutCase?.depositHeld ?? data.workspace.totals.depositAmount
  const depositScheme = data.checkoutCase?.depositScheme
  const monthlyRent = data.workspace.overview.monthlyRent
  const rentArrears = data.workspace.overview.rentArrears
  const keysReturned = data.keys.filter((k) => k.status === 'returned').length
  const keysOutstanding = data.keys.filter((k) => k.status === 'outstanding').length
  const untestedDetectors = data.detectors.filter((d) => !d.tested).length
  const failedCompliance = data.compliance.filter((c) => c.passed === false).length
  const safetyAttentionCount = untestedDetectors + failedCompliance

  return (
    <div className="space-y-8">
      <WorkspaceNotice
        tone="info"
        icon={<Info className="h-4 w-4" />}
        title="Read-only view"
        body="Readings and financial data are synced from the source reports. To update, re-upload the relevant checkout or check-in report."
      />

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

      <Section
        title="Utilities"
        badge={data.utilities.length > 0 ? <WorkspaceBadge label={`${data.utilities.length} recorded`} tone="info" size="compact" /> : null}
      >
        {data.utilities.length > 0 ? (
          <div className="mt-3 overflow-x-auto border border-zinc-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Check-in reading</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Checkout reading</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Usage</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Unit</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Meter location</th>
                </tr>
              </thead>
              <tbody>
                {data.utilities.map((u) => {
                  const unit = getUtilityUnit(u.utilityType)
                  return (
                    <tr key={u.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-zinc-950">{formatEnumLabel(u.utilityType)}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-zinc-600">{u.readingCheckin ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-zinc-600">{u.readingCheckout ?? '—'}</td>
                      <td className="px-4 py-2.5 font-mono text-sm text-zinc-600">{u.usageCalculated ?? '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-zinc-400">{unit || '—'}</td>
                      <td className="px-4 py-2.5 text-zinc-500">{u.meterLocation || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">No utility readings recorded.</p>
        )}
      </Section>

      <Divider />

      <Section
        title="Keys"
        badge={
          data.keys.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {keysReturned > 0 ? <WorkspaceBadge label={`${keysReturned} returned`} tone="accepted" size="compact" /> : null}
              {keysOutstanding > 0 ? <WorkspaceBadge label={`${keysOutstanding} outstanding`} tone="fail" size="compact" /> : null}
            </div>
          ) : null
        }
      >
        {data.keys.length > 0 ? (
          <div className="mt-3 overflow-x-auto border border-zinc-200">
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
                    <td className="px-4 py-2.5 tabular-nums text-zinc-600">{k.keyCount}</td>
                    <td className="px-4 py-2.5">
                      <WorkspaceBadge
                        label={formatEnumLabel(k.status)}
                        tone={
                          k.status === 'returned'
                            ? 'accepted'
                            : k.status === 'outstanding'
                              ? 'fail'
                              : 'neutral'
                        }
                        size="compact"
                      />
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

      <Divider />

      <Section
        title="Safety and compliance"
        badge={
          data.detectors.length > 0 || data.compliance.length > 0 ? (
            safetyAttentionCount > 0
              ? <WorkspaceBadge label={`${safetyAttentionCount} attention`} tone="warning" size="compact" />
              : <WorkspaceBadge label="All clear" tone="accepted" size="compact" />
          ) : null
        }
      >
        {data.detectors.length > 0 ? (
          <>
            <p className="mt-2 text-xs font-medium text-zinc-500">Detectors</p>
            <div className="mt-2 overflow-x-auto border border-zinc-200">
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
                        <WorkspaceBadge
                          label={d.tested ? 'Tested' : 'Not tested'}
                          tone={d.tested ? 'pass' : 'fail'}
                          size="compact"
                        />
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
            <div className="mt-2 overflow-x-auto border border-zinc-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Item</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Result</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.compliance.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-zinc-950">{c.checkItem}</td>
                      <td className="px-4 py-2.5">
                        <WorkspaceBadge
                          label={c.passed === true ? 'Passed' : c.passed === false ? 'Failed' : 'Not assessed'}
                          tone={c.passed === true ? 'pass' : c.passed === false ? 'fail' : 'neutral'}
                          size="compact"
                        />
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
