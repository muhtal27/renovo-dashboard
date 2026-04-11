'use client'

import { formatCurrency } from '@/app/eot/_components/eot-ui'
import type { EotClaimRecoveryMetrics } from '@/lib/eot-types'

export function AnalyticsClaimRecovery({
  data,
}: {
  data: EotClaimRecoveryMetrics
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-12 gap-y-5 text-sm xl:grid-cols-4">
      <div>
        <dt className="text-xs text-zinc-500">Total claimed</dt>
        <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
          {formatCurrency(data.total_claimed)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500">Total recovered</dt>
        <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-emerald-700">
          {formatCurrency(data.total_recovered)}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500">Success rate</dt>
        <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
          {data.success_rate.toFixed(0)}%
        </dd>
      </div>
      <div>
        <dt className="text-xs text-zinc-500">Avg. claim / case</dt>
        <dd className="mt-0.5 text-2xl font-semibold tracking-tight text-zinc-950">
          {formatCurrency(data.avg_claim_per_case)}
        </dd>
      </div>
    </dl>
  )
}
