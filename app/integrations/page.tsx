import Link from 'next/link'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

export const metadata = createMarketingMetadata({
  title: 'Integrations. Renovo AI',
  description:
    'Every UK deposit scheme. The inventory apps and property management platforms your clerks already use. Renovo lives between them.',
  path: '/integrations',
})

type Integration = {
  logo: string
  name: string
  kind: string
  desc: string
  status: 'live' | 'beta' | 'soon'
}

const integrations: Integration[] = [
  { logo: 'SDS', name: 'SafeDeposits Scotland', kind: 'Scheme · Scotland', desc: 'Full connector. Case registration, adjudication bundle submission, and outcome sync.', status: 'live' },
  { logo: 'mD', name: 'mydeposits', kind: 'Scheme · UK-wide', desc: 'Supports both Scotland and England & Wales schemes under one connector.', status: 'live' },
  { logo: 'DPS', name: 'Deposit Protection Service', kind: 'Scheme · England & Wales', desc: 'Custodial and insured flows. Bundles pushed directly into the DPS case record.', status: 'live' },
  { logo: 'TDS', name: 'Tenancy Deposit Scheme', kind: 'Scheme · England & Wales', desc: 'Structured evidence format generated natively. No reformatting of the bundle needed.', status: 'live' },
  { logo: 'Re', name: 'Reapit AppMarket', kind: 'CRM · OAuth2', desc: 'Two-way sync via AppMarket: tenancies, landlords, properties, documents.', status: 'live' },
  { logo: 'Al', name: 'Alto by Zoopla', kind: 'CRM · Partner API', desc: 'Tenancy pull on schedule; outcomes written back as activity entries.', status: 'live' },
  { logo: 'Jx', name: 'Jupix', kind: 'CRM · REST', desc: 'Tenancy & property sync on tenancy-end. Deduction letters attach back.', status: 'live' },
  { logo: 'MR', name: 'MRI (Qube)', kind: 'PropertyTech', desc: 'Daily bulk sync of tenancy and property data. Outcomes pushed back as JSON.', status: 'live' },
  { logo: 'Ib', name: 'InventoryBase', kind: 'Inventory · Webhook', desc: 'Reports delivered via webhook. Photos, annotations, and condition scores imported natively.', status: 'live' },
  { logo: 'NL', name: 'No Letting Go', kind: 'Inventory · API', desc: 'Dilapidations register and schedule of condition ingest. Scottish variant supported.', status: 'live' },
  { logo: 'Ih', name: 'Inventory Hive', kind: 'Inventory · OAuth2', desc: 'Check-in vs checkout comparison pulled pre-structured for defect detection.', status: 'live' },
  { logo: 'PDF', name: 'PDF / photo upload', kind: 'Universal fallback', desc: 'No inventory app? Drop a PDF and a photo folder. Renovo parses and links them.', status: 'live' },
  { logo: 'Xr', name: 'Xero', kind: 'Accounting · OAuth2', desc: 'Deposit splits posted to the correct chart-of-accounts line, fully reversible.', status: 'beta' },
  { logo: 'Sg', name: 'Sage Business Cloud', kind: 'Accounting · REST', desc: 'Dual-sided journal entries for deposit returns. Scottish property CoA supported.', status: 'beta' },
  { logo: 'M3', name: 'Microsoft 365', kind: 'Email · Graph API', desc: 'Outlook-native sending with SharePoint attachments. SSO via Entra ID.', status: 'live' },
  { logo: 'Ds', name: 'DocuSign', kind: 'E-signature', desc: 'Tenant sign-off on agreed deduction splits. Signed PDFs attached to the case.', status: 'soon' },
]

const statusLabel: Record<Integration['status'], string> = {
  live: 'Live',
  beta: 'Beta',
  soon: 'Soon',
}

export default function IntegrationsPage() {
  return (
    <MarketingShell currentPath="/integrations">
      <section className="page-hero">
        <p className="kicker">Integrations</p>
        <h1>
          Connects to the tools
          <br />
          <span className="accent">you already run.</span>
        </h1>
        <p className="page-hero-sub">
          Every UK deposit scheme. The inventory apps and property management platforms your clerks already use. Renovo lives between them. Your CRM stays the source of truth for tenancies. The scheme stays the source of truth for adjudication.
        </p>
      </section>

      <section className="section first">
        <div className="int-wrap">
          {integrations.map((i) => (
            <div key={i.name} className="int-card2">
              <div className="int-logo2">{i.logo}</div>
              <div className="int-name2">{i.name}</div>
              <div className="int-kind2">{i.kind}</div>
              <p className="int-desc2">{i.desc}</p>
              <span className={`int-status2 ${i.status}`}>{statusLabel[i.status]}</span>
            </div>
          ))}
        </div>

        <div className="int-sub">
          <span className="int-sub-t">Can&apos;t see your tool?</span>
          <span className="int-sub-i">
            Public REST API, see{' '}
            <Link
              href="/developers"
              style={{ color: 'var(--em-400)', textDecoration: 'underline' }}
            >
              Developers
            </Link>
          </span>
          <span className="int-sub-i">Webhook bus, eight event types</span>
          <span className="int-sub-i">Enterprise custom connectors</span>
        </div>
      </section>

      <section className="cta-lite">
        <div className="cta-lite-inner">
          <div>
            <h3>Run through a live sync on one of your tenancies.</h3>
            <p className="cta-lite-sub">
              We&apos;ll connect a sandbox Reapit or Alto test environment and walk through the full round-trip.
            </p>
          </div>
          <div className="cta-lite-btns">
            <Link href="/book-demo" className="btn-primary">
              Book a demo →
            </Link>
            <Link href="/developers" className="btn-outline">
              Read API docs
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
