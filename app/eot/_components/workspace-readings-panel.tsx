'use client'

import { Gauge, Key, Shield } from 'lucide-react'
import { cn } from '@/lib/ui'
import type { EotUtilityReading, EotKeySet } from '@/lib/eot-types'

/* ── Utility readings table ───────────────────────────────────── */

function UtilityReadingsTable({ readings }: { readings: EotUtilityReading[] }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-zinc-400" />
        <h4 className="text-sm font-semibold text-zinc-900">Utility Readings</h4>
      </div>
      {readings.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No utility readings recorded.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Type</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Usage</th>
                <th>Meter Location</th>
              </tr>
            </thead>
            <tbody>
              {readings.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-zinc-900">{r.utility_type}</td>
                  <td className="tabular-nums text-zinc-700">{r.reading_checkin ?? '—'}</td>
                  <td className="tabular-nums text-zinc-700">{r.reading_checkout ?? '—'}</td>
                  <td className="font-semibold tabular-nums text-zinc-900">
                    {r.usage ? `${r.usage} ${r.unit}` : '—'}
                  </td>
                  <td className="text-zinc-500">{r.meter_location ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Keys status ──────────────────────────────────────────────── */

function KeysStatus({ keys }: { keys: EotKeySet[] }) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2">
        <Key className="h-4 w-4 text-zinc-400" />
        <h4 className="text-sm font-semibold text-zinc-900">Keys</h4>
      </div>
      {keys.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No key records.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div>
                <p className="text-[13px] font-medium text-zinc-900">
                  {k.set_name} ({k.key_count} key{k.key_count > 1 ? 's' : ''})
                </p>
                <p className="text-[11px] text-zinc-500">{k.notes ?? ''}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                  k.status === 'returned'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {k.status === 'returned' ? 'Returned' : 'Outstanding'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Safety & compliance (static for now — no DB table yet) ──── */

const SAFETY_DETECTORS = [
  { id: 'smoke-hallway', type: 'Smoke', location: 'Hallway (ground floor)', tested: true, expiry: '14 Aug 2026' },
  { id: 'co-kitchen', type: 'Carbon Monoxide', location: 'Kitchen', tested: true, expiry: '22 Mar 2027' },
  { id: 'heat-kitchen', type: 'Heat', location: 'Kitchen', tested: false, expiry: '01 Jan 2025' },
] as const

function SafetyCompliance() {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-zinc-400" />
        <h4 className="text-sm font-semibold text-zinc-900">Safety & Compliance</h4>
      </div>
      <div className="mt-4 space-y-3">
        {SAFETY_DETECTORS.map((d) => {
          const isExpired = new Date(d.expiry) < new Date()
          return (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
            >
              <div>
                <p className="text-[13px] font-medium text-zinc-900">
                  {d.type} Detector
                </p>
                <p className="text-[11px] text-zinc-500">{d.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                    d.tested
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-zinc-200 bg-zinc-100 text-zinc-500',
                  )}
                >
                  {d.tested ? 'Tested' : 'Not Tested'}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    isExpired ? 'text-rose-600' : 'text-zinc-500',
                  )}
                >
                  {isExpired ? 'Expired' : d.expiry}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main export ──────────────────────────────────────────────── */

type WorkspaceReadingsPanelProps = {
  utilities: EotUtilityReading[]
  keys: EotKeySet[]
}

export function WorkspaceReadingsPanel({ utilities, keys }: WorkspaceReadingsPanelProps) {
  return (
    <div className="space-y-5">
      <UtilityReadingsTable readings={utilities} />
      <div className="grid gap-5 lg:grid-cols-2">
        <KeysStatus keys={keys} />
        <SafetyCompliance />
      </div>
    </div>
  )
}
