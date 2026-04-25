import type { Metadata } from 'next'
import { LedgerView } from './ledger-view'

export const metadata: Metadata = {
  title: 'Ledger · Renovo Finance',
}

export default function LedgerPage() {
  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900">Ledger</h1>
          <p className="mt-1 text-sm text-zinc-500">
            One row per month — actuals from the bank, forecast rows projected forward.
          </p>
        </div>
      </div>
      <LedgerView />
    </div>
  )
}
