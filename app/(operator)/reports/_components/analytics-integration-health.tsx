'use client'

import { formatEnumLabel } from '@/app/eot/_components/eot-ui'
import { relativeTime } from '@/lib/relative-time'
import type { EotIntegrationHealthSummary } from '@/lib/eot-types'

function healthDotColor(health: string) {
  switch (health) {
    case 'healthy':
      return 'bg-emerald-500'
    case 'degraded':
      return 'bg-amber-500'
    case 'unhealthy':
      return 'bg-rose-500'
    default:
      return 'bg-zinc-400'
  }
}

function statusBadgeColor(status: string) {
  switch (status) {
    case 'active':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pending':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'disabled':
    case 'auth_failed':
      return 'bg-rose-50 text-rose-700 border-rose-200'
    default:
      return 'bg-zinc-50 text-zinc-700 border-zinc-200'
  }
}

export function AnalyticsIntegrationHealth({
  data,
}: {
  data: EotIntegrationHealthSummary
}) {
  if (data.connections.length === 0) {
    return <p className="text-sm text-zinc-400">No integrations connected.</p>
  }

  return (
    <div className="space-y-4">
      {data.total_dead_letters > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          <span className="h-2 w-2 rounded-full bg-rose-500" />
          {data.total_dead_letters} dead-letter sync{data.total_dead_letters !== 1 ? 's' : ''} pending recovery
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {data.connections.map((conn) => (
          <div
            key={conn.connection_id}
            className="border border-zinc-200 bg-white px-5 py-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${healthDotColor(conn.health_status)}`}
                  title={conn.health_status}
                />
                <span className="text-sm font-semibold text-zinc-950">
                  {conn.display_name || formatEnumLabel(conn.provider)}
                </span>
              </div>
              <span
                className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusBadgeColor(conn.status)}`}
              >
                {formatEnumLabel(conn.status)}
              </span>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Sync success rate</span>
                <span className="tabular-nums font-medium text-zinc-700">
                  {conn.sync_success_rate.toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    conn.sync_success_rate >= 90
                      ? 'bg-emerald-500'
                      : conn.sync_success_rate >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${conn.sync_success_rate}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>
                  Last sync:{' '}
                  {conn.last_synced_at ? relativeTime(conn.last_synced_at) : 'Never'}
                </span>
                {conn.dead_letter_count > 0 && (
                  <span className="font-medium text-rose-600">
                    {conn.dead_letter_count} dead letter{conn.dead_letter_count !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {conn.consecutive_failures > 0 && (
                <p className="text-xs text-amber-600">
                  {conn.consecutive_failures} consecutive failure{conn.consecutive_failures !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
