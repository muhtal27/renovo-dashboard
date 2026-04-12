'use client'

import { useState } from 'react'
import { useEotAnalyticsDashboard } from '@/lib/queries/eot-queries'
import { SkeletonPanel } from '@/app/operator-ui'
import type { EotAnalyticsDashboard } from '@/lib/eot-types'
import { AnalyticsThroughput } from './analytics-throughput'
import { AnalyticsResolutionTime } from './analytics-resolution-time'
import { AnalyticsClaimRecovery } from './analytics-claim-recovery'
import { AnalyticsTeamWorkload } from './analytics-team-workload'
import { AnalyticsIntegrationHealth } from './analytics-integration-health'

const PERIOD_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
] as const

export function AnalyticsClient({
  initialData,
}: {
  initialData?: EotAnalyticsDashboard | null
}) {
  const [days, setDays] = useState(30)
  const { data, isLoading } = useEotAnalyticsDashboard(days, initialData)

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <SkeletonPanel className="h-10" />
        <div className="grid gap-4 xl:grid-cols-2">
          <SkeletonPanel className="h-[240px]" />
          <SkeletonPanel className="h-[240px]" />
        </div>
        <SkeletonPanel className="h-[160px]" />
        <SkeletonPanel className="h-[200px]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-10 text-center">
        <h3 className="text-sm font-semibold text-zinc-950">No analytics data</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Create cases and process claims to populate analytics.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Period selector */}
      <div className="flex items-center gap-1.5">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDays(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              days === opt.value
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Case throughput + Resolution time */}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-6 md:px-7">
          <h3 className="text-sm font-semibold text-zinc-950">Case throughput</h3>
          <p className="mt-1 text-xs text-zinc-400">Cases created vs resolved per week</p>
          <div className="mt-4">
            <AnalyticsThroughput data={data.throughput} />
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-6 md:px-7">
          <h3 className="text-sm font-semibold text-zinc-950">Resolution time</h3>
          <p className="mt-1 text-xs text-zinc-400">How long cases take to resolve</p>
          <div className="mt-4">
            <AnalyticsResolutionTime data={data.resolution_time} />
          </div>
        </section>
      </div>

      {/* Claim recovery */}
      <section className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Claim recovery</h3>
        <p className="mt-1 text-xs text-zinc-400">Deposit claim performance</p>
        <div className="mt-4">
          <AnalyticsClaimRecovery data={data.claim_recovery} />
        </div>
      </section>

      {/* Team workload */}
      <section className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Team workload</h3>
        <p className="mt-1 text-xs text-zinc-400">Case distribution across team members</p>
        <div className="mt-4">
          <AnalyticsTeamWorkload data={data.team_workload} />
        </div>
      </section>

      {/* Integration health */}
      <section className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-sm backdrop-blur-sm px-6 py-6 md:px-7">
        <h3 className="text-sm font-semibold text-zinc-950">Integration health</h3>
        <p className="mt-1 text-xs text-zinc-400">Connected systems and sync status</p>
        <div className="mt-4">
          <AnalyticsIntegrationHealth data={data.integration_health} />
        </div>
      </section>
    </div>
  )
}
