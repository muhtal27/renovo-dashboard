import type { Metadata } from 'next'
import { HeadcountView } from './headcount-view'

export const metadata: Metadata = {
  title: 'Headcount · Renovo Finance',
}

export default function HeadcountPage() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">Headcount</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Current team plus planned hires. Loaded cost = gross + employer NI + pension. Payroll in the ledger auto-suggests from this plan.
        </p>
      </div>
      <HeadcountView />
    </div>
  )
}
