import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Deposit Schemes | Renovo AI',
}

const DEPOSIT_SCHEMES = [
  {
    region: 'Scotland',
    schemes: [
      { name: 'SafeDeposits Scotland', desc: 'The largest tenancy deposit scheme in Scotland.' },
      { name: 'Letting Protection Service Scotland', desc: 'Government-approved scheme offering custodial deposit protection.' },
      { name: 'mydeposits Scotland', desc: 'Insurance-backed deposit protection with online management tools.' },
    ],
  },
  {
    region: 'England & Wales',
    schemes: [
      { name: 'Deposit Protection Service (DPS)', desc: 'Free custodial scheme backed by the government.' },
      { name: 'mydeposits', desc: 'Insurance-backed and custodial options with online deposit management.' },
      { name: 'Tenancy Deposit Scheme (TDS)', desc: 'Offers both insured and custodial protection with free dispute resolution.' },
    ],
  },
  {
    region: 'Northern Ireland',
    schemes: [
      { name: 'TDSNI', desc: 'The primary custodial deposit scheme for Northern Ireland.' },
    ],
  },
]

export default async function DepositSchemePage() {
  await requireOperatorTenant('/deposit-scheme')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Deposit Schemes</h2>
        <p className="mt-1 text-[13px] text-zinc-500">
          Approved UK deposit protection schemes by region
        </p>
      </div>

      {DEPOSIT_SCHEMES.map((group) => (
        <div key={group.region}>
          <h3 className="mb-3 text-base font-semibold text-zinc-900">
            {group.region}{' '}
            <span className="text-[13px] font-medium text-zinc-500">
              ({group.schemes.length} schemes)
            </span>
          </h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {group.schemes.map((scheme) => (
              <div key={scheme.name} className="rounded-[10px] border border-zinc-200 bg-white p-5">
                <h4 className="text-sm font-semibold text-zinc-900">{scheme.name}</h4>
                <p className="mt-2 text-[13px] text-zinc-500">{scheme.desc}</p>
                <button
                  type="button"
                  className="mt-3 flex items-center gap-1.5 rounded-[10px] border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium text-zinc-700 transition hover:bg-zinc-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                  Visit Website
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
