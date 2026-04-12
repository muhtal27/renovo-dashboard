import type { Metadata } from 'next'
import { requireOperatorTenant } from '@/lib/operator-server'

export const metadata: Metadata = {
  title: 'Deposit Scheme | Renovo AI',
}

const DEPOSIT_SCHEMES = [
  {
    region: 'Scotland',
    schemes: [
      {
        name: 'SafeDeposits Scotland',
        url: 'https://www.safedepositsscotland.com',
        description:
          'The largest tenancy deposit scheme in Scotland, providing free dispute resolution for landlords and tenants.',
      },
      {
        name: 'Letting Protection Service Scotland',
        url: 'https://www.lettingprotectionscotland.com',
        description:
          'Government-approved scheme offering custodial deposit protection and independent adjudication.',
      },
      {
        name: 'mydeposits Scotland',
        url: 'https://www.mydeposits.co.uk/scotland',
        description:
          'Insurance-backed deposit protection with online management tools and alternative dispute resolution.',
      },
    ],
  },
  {
    region: 'England & Wales',
    schemes: [
      {
        name: 'Deposit Protection Service (DPS)',
        url: 'https://www.depositprotection.com',
        description:
          'Free custodial scheme backed by the government, holding deposits in a secure account for the duration of the tenancy.',
      },
      {
        name: 'mydeposits',
        url: 'https://www.mydeposits.co.uk',
        description:
          'Insurance-backed and custodial options with online deposit management and dispute resolution.',
      },
      {
        name: 'Tenancy Deposit Scheme (TDS)',
        url: 'https://www.tenancydepositscheme.com',
        description:
          'Offers both insured and custodial protection with a free independent dispute resolution service.',
      },
    ],
  },
  {
    region: 'Northern Ireland',
    schemes: [
      {
        name: 'Tenancy Deposit Scheme Northern Ireland (TDSNI)',
        url: 'https://www.tdsni.co.uk',
        description:
          'The primary custodial deposit scheme for Northern Ireland, providing free protection and dispute resolution.',
      },
      {
        name: 'Letting Protection Service Northern Ireland',
        url: 'https://www.lettingprotectionni.com',
        description:
          'Government-approved scheme offering insurance-backed deposit protection for Northern Ireland tenancies.',
      },
    ],
  },
]

export default async function DepositSchemePage() {
  await requireOperatorTenant('/deposit-scheme')

  return (
    <div className="space-y-8 px-6 py-6 md:px-7 animate-fade-in-up">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          Deposit Scheme
        </p>
        <h1 className="mt-2 text-[1.5rem] font-semibold tracking-[-0.03em] text-zinc-950">
          Tenancy deposit protection schemes
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          All UK tenancy deposits must be registered with a government-approved scheme. Below are
          the approved schemes by region for reference when processing end-of-tenancy claims.
        </p>
      </div>

      {DEPOSIT_SCHEMES.map((group) => (
        <section key={group.region}>
          <div className="flex items-end gap-8 border-b border-zinc-200/60 pb-3">
            <h2 className="text-sm font-semibold text-zinc-950">{group.region}</h2>
            <span className="text-xs tabular-nums text-zinc-500">
              {group.schemes.length} scheme{group.schemes.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {group.schemes.map((scheme) => (
              <div key={scheme.name} className="border-l-2 border-zinc-200/60 py-3 pl-5 animate-fade-in-up">
                <div className="flex items-baseline gap-3">
                  <h3 className="text-sm font-semibold text-zinc-950">{scheme.name}</h3>
                  <a
                    href={scheme.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    Visit site &rarr;
                  </a>
                </div>
                <p className="mt-1 text-sm leading-6 text-zinc-600">{scheme.description}</p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
