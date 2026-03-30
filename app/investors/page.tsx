import {
  MarketingButton,
  MarketingCard,
  MarketingIntro,
  MarketingRuleList,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'

const whyItMatters = [
  'Checkout administration is still handled manually across reports, photos, email, and memory in many agencies.',
  'Liability assessments are difficult to standardise when teams are under time pressure and portfolios are growing.',
  'Dispute outcomes often depend on whether the evidence pack and reasoning trail are complete when the file reaches the scheme.',
] as const

const companyPoints = [
  'Renovo AI was built from direct operational experience of checkout review, liability assessment, and claim preparation.',
  'The product is focused on a specific workflow problem: turning evidence into reviewable, defensible checkout decisions without removing manager judgement.',
  'The company is being built with a narrow operational scope rather than a broad property software platform pitch.',
] as const

export const metadata = createMarketingMetadata({
  title: 'Investors | Renovo AI',
  description:
    'Investor overview for Renovo AI, including the workflow problem, product focus, and company one-pager.',
  path: '/investors',
})

export default function InvestorsPage() {
  return (
    <MarketingShell currentPath="/investors">
      <MarketingSection>
        <MarketingIntro
          titleAs="h1"
          eyebrow="Investors"
          title="Renovo AI is building the operating layer between checkout evidence and defensible deduction decisions."
          description="Renovo AI gives letting agencies a structured route from checkout report to liability assessment, deduction letter, landlord review, and dispute pack preparation."
        />
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <div>
            <p className="marketing-eyebrow">Why this matters</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.045em] text-[var(--text-strong)]">
              A workflow category with <em>high operational drag</em>
            </h2>
            <MarketingRuleList>
              {whyItMatters.map((item) => (
                <p key={item} className="py-5 text-sm leading-7 text-[var(--text-body)]">
                  {item}
                </p>
              ))}
            </MarketingRuleList>
          </div>

          <MarketingCard className="h-fit">
            <p className="marketing-eyebrow">Current focus</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-[var(--text-body)]">
              <p>Product built around the live end-of-tenancy workflow.</p>
              <p>Founder-led commercial discussions with agencies and workflow partners.</p>
              <p>
                Integration planning shaped by operational handoff points rather than generic
                platform breadth.
              </p>
            </div>
          </MarketingCard>
        </div>
      </MarketingSection>

      <MarketingSection variant="tint">
        <div className="max-w-[58rem]">
          <p className="marketing-eyebrow">Company</p>
          <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.045em] text-[var(--text-strong)]">
            Built from direct <em>operational exposure</em>
          </h2>
        </div>

        <MarketingRuleList>
          {companyPoints.map((item) => (
            <p key={item} className="py-5 text-sm leading-7 text-[var(--text-body)]">
              {item}
            </p>
          ))}
        </MarketingRuleList>
      </MarketingSection>

      <MarketingSection>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <p className="marketing-eyebrow">Next step</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.045em] text-[var(--text-strong)]">
              Download the one-pager or <em>contact us directly</em>
            </h2>
            <p className="mt-4 max-w-[48rem] text-base leading-8 text-[var(--text-body)]">
              The one-pager covers the workflow problem, product scope, and current company focus.
              For investor or strategic discussions, use the contact route and we&apos;ll reply directly.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <MarketingButton href="/renovo-company-one-pager.pdf" download>
              Download company one-pager
            </MarketingButton>
            <MarketingButton href="/contact" variant="secondary">
              Contact Renovo AI
            </MarketingButton>
          </div>
        </div>
      </MarketingSection>
    </MarketingShell>
  )
}
