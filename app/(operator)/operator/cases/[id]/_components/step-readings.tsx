'use client'

import { WorkspaceBadge } from '@/app/(operator)/operator/cases/[id]/_components/checkout-workspace-ui'
import { formatDate, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCheckoutWorkspaceData } from '@/lib/operator-checkout-workspace-types'

/** Map utility type to a badge tone */
function getUtilityTone(type: string): 'expired' | 'info' | 'active' {
  const normalized = type.toLowerCase()
  if (normalized.includes('electric')) return 'expired' // amber
  if (normalized.includes('gas')) return 'info' // sky
  return 'active' // cyan/emerald for water and others
}

export function StepReadings({ data }: { data: OperatorCheckoutWorkspaceData }) {
  const keysReturned = data.keys.filter((k) => k.status === 'returned').length
  const allKeysReturned = data.keys.length > 0 && keysReturned === data.keys.length
  const testedDetectors = data.detectors.filter((d) => d.tested).length
  const allTested =
    data.detectors.length > 0 && testedDetectors === data.detectors.length

  return (
    <div className="space-y-6">
      {/* ── Utility Readings ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Utility Readings</h3>
          {data.utilities.length > 0 && (
            <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700">
              {data.utilities.length} meter{data.utilities.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {data.utilities.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-[10px] border border-zinc-200">
            <table className="w-full text-left">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Check-in</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Checkout</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Usage</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Location</th>
                </tr>
              </thead>
              <tbody>
                {data.utilities.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px]">
                      <WorkspaceBadge label={formatEnumLabel(u.utilityType)} tone={getUtilityTone(u.utilityType)} size="compact" />
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] tabular-nums text-zinc-700">
                      {u.readingCheckin ?? '—'}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] tabular-nums text-zinc-700">
                      {u.readingCheckout ?? '—'}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] tabular-nums text-zinc-700">
                      {u.usageCalculated ?? '—'}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] text-xs text-zinc-400">
                      {u.meterLocation || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No utility readings recorded.</p>
        )}
      </div>

      {/* ── Keys ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Keys</h3>
          {data.keys.length > 0 && (
            <WorkspaceBadge
              label={`${keysReturned}/${data.keys.length} returned`}
              tone={allKeysReturned ? 'accepted' : 'expired'}
              size="compact"
            />
          )}
        </div>

        {data.keys.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-[10px] border border-zinc-200">
            <table className="w-full text-left">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Set</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Count</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Status</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Notes</th>
                </tr>
              </thead>
              <tbody>
                {data.keys.map((k) => (
                  <tr key={k.id} className="hover:bg-zinc-50">
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] font-medium text-zinc-950">
                      {k.setName}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] tabular-nums text-zinc-700">
                      {k.keyCount}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px]">
                      <WorkspaceBadge
                        label={formatEnumLabel(k.status)}
                        tone={k.status === 'returned' ? 'accepted' : k.status === 'outstanding' ? 'fail' : 'neutral'}
                        size="compact"
                      />
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] text-zinc-500">
                      {k.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No key records.</p>
        )}
      </div>

      {/* ── Safety & Compliance ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-950">Safety &amp; Compliance</h3>
          {data.detectors.length > 0 && (
            <WorkspaceBadge
              label={`${testedDetectors}/${data.detectors.length} tested`}
              tone={allTested ? 'accepted' : 'expired'}
              size="compact"
            />
          )}
        </div>

        {data.detectors.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-[10px] border border-zinc-200">
            <table className="w-full text-left">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Type</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Location</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Tested</th>
                  <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {data.detectors.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-50">
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] font-medium text-zinc-950">
                      {formatEnumLabel(d.detectorType)}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] text-zinc-600">
                      {d.location}
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px]">
                      <WorkspaceBadge
                        label={d.tested ? 'Tested' : 'Untested'}
                        tone={d.tested ? 'accepted' : 'fail'}
                        size="compact"
                      />
                    </td>
                    <td className="border-t border-zinc-100 px-4 py-3 text-[13px] text-zinc-500">
                      {formatDate(d.expiryDate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No safety or compliance records.</p>
        )}
      </div>

      {/* ── Council Tax ── */}
      <div className="rounded-[10px] border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-950">Council Tax</h3>

        {data.councilTax ? (
          <div className="mt-4 grid grid-cols-3 gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Council</p>
              <p className="mt-1 text-[13px] font-medium text-zinc-950">
                {data.councilTax.councilName || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Band</p>
              <p className="mt-1 text-[13px] font-medium text-zinc-950">
                {data.councilTax.band || '—'}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Notified</p>
              <div className="mt-1">
                {data.councilTax.councilNotified ? (
                  <WorkspaceBadge
                    label={data.councilTax.notifiedAt ? `Yes — ${formatDate(data.councilTax.notifiedAt)}` : 'Yes'}
                    tone="accepted"
                    size="compact"
                  />
                ) : (
                  <span className="text-[13px] text-amber-700">No</span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No council tax details recorded.</p>
        )}
      </div>
    </div>
  )
}
