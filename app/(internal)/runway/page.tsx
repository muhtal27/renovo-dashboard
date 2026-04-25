import type { Metadata } from 'next'
import { RunwayDashboardView } from './dashboard-view'

export const metadata: Metadata = {
  title: 'Runway · Renovo Finance',
}

export default function RunwayDashboardPage() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">Runway</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Derived live from the ledger. Update actuals weekly, forecast rows monthly.
        </p>
      </div>
      <RunwayDashboardView />
    </div>
  )
}
