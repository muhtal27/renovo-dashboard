'use client'

import type { EotTeamMemberWorkload } from '@/lib/eot-types'

export function AnalyticsTeamWorkload({
  data,
}: {
  data: EotTeamMemberWorkload[]
}) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-400">No team members found.</p>
  }

  const maxCases = Math.max(...data.map((m) => m.total_cases), 1)

  return (
    <div className="overflow-hidden border border-zinc-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80">
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
              Member
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-500">
              Cases
            </th>
            <th className="hidden px-4 py-2.5 text-right text-xs font-medium text-zinc-500 sm:table-cell">
              Resolved
            </th>
            <th className="hidden px-4 py-2.5 text-right text-xs font-medium text-zinc-500 md:table-cell">
              Avg. resolution
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((member) => (
            <tr
              key={member.user_id}
              className="border-b border-zinc-100 last:border-0 transition hover:bg-zinc-50/60"
            >
              <td className="px-4 py-3 font-medium text-zinc-950">
                {member.display_name}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all"
                      style={{ width: `${(member.total_cases / maxCases) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-zinc-600">{member.total_cases}</span>
                </div>
              </td>
              <td className="hidden px-4 py-3 text-right tabular-nums text-zinc-600 sm:table-cell">
                {member.resolved_cases}
              </td>
              <td className="hidden px-4 py-3 text-right text-xs tabular-nums text-zinc-400 md:table-cell">
                {member.avg_resolution_days != null
                  ? `${member.avg_resolution_days.toFixed(1)}d`
                  : '\u2014'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
