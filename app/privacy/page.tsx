import {
  MarketingFinalCta,
  MarketingIntro,
  MarketingRuleList,
  MarketingSection,
} from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'
import { createMarketingMetadata } from '@/lib/marketing-metadata'
import type { ReactNode } from 'react'

const informationCategories = [
  {
    title: 'Account and contact information',
    body: 'We may handle basic account, user, and contact information needed to provide access to the platform and support customer relationships.',
  },
  {
    title: 'Property and tenancy information',
    body: 'We may handle information related to properties, tenancies, inventories, checkouts, and end-of-tenancy workflows where required to deliver the service.',
  },
  {
    title: 'Operational case information',
    body: 'We may handle case-related information, supporting records, issue tracking, and workflow data used to manage tenancy-related processes.',
  },
  {
    title: 'Support and communications data',
    body: 'We may keep records of enquiries, service communications, and support interactions to help operate and improve the service.',
  },
  {
    title: 'Technical and usage information',
    body: 'We may process technical and usage information to maintain system performance, reliability, and security.',
  },
] as const

const usageCategories = [
  {
    title: 'Delivering and operating the service',
    body: 'We use information to run the platform, support tenancy-related workflows, and provide the core functionality customers rely on.',
  },
  {
    title: 'Customer relationships and support',
    body: 'We use information to respond to enquiries, manage onboarding and customer relationships, and provide support where needed.',
  },
  {
    title: 'Reliability, security, and improvement',
    body: 'We use information to maintain platform functionality, improve reliability, strengthen security, and refine how the service operates over time.',
  },
  {
    title: 'Operational, legal, and contractual needs',
    body: 'We may use information where needed to meet applicable legal, contractual, or operational requirements connected to running the service responsibly.',
  },
] as const

const handlingPrinciples = [
  {
    title: 'Access restriction',
    body: 'Access to information is limited to authorised users and appropriate personnel or service providers with a legitimate operational need.',
  },
  {
    title: 'Data minimisation',
    body: 'We aim to limit the information we handle to what is relevant for delivering and supporting the service.',
  },
  {
    title: 'Retention',
    body: 'We retain information in line with operational needs, customer relationships, and applicable legal or contractual considerations.',
  },
  {
    title: 'Security and controlled processing',
    body: 'We apply appropriate technical and organisational measures to help protect information and support responsible processing.',
  },
  {
    title: 'Ongoing improvement',
    body: 'We continue to review and improve our privacy, security, and operational practices as the platform matures.',
  },
] as const

export const metadata = createMarketingMetadata({
  title: 'Privacy | Renovo AI',
  description:
    'Learn how Renovo AI approaches privacy, responsible information handling, and the protection of customer and operational data.',
  path: '/privacy',
})

function PrivacyList({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string
  title: ReactNode
  items: readonly { title: string; body: string }[]
}) {
  return (
    <MarketingSection>
      <div className="max-w-[56rem]">
        <p className="marketing-eyebrow">{eyebrow}</p>
        <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.045em] text-[var(--text-strong)]">
          {title}
        </h2>
      </div>
      <MarketingRuleList>
        {items.map((item) => (
          <div key={item.title} className="grid gap-3 py-6 md:grid-cols-[280px_minmax(0,1fr)]">
            <h3 className="text-base font-semibold text-[var(--text-strong)]">{item.title}</h3>
            <p className="text-sm leading-7 text-[var(--text-body)]">{item.body}</p>
          </div>
        ))}
      </MarketingRuleList>
    </MarketingSection>
  )
}

export default function PrivacyPage() {
  return (
    <MarketingShell currentPath="/privacy">
      <MarketingSection>
        <MarketingIntro
          titleAs="h1"
          eyebrow="Privacy"
          title="Privacy"
          description="Renovo AI is committed to handling personal and operational information responsibly. We aim to use data carefully, securely, and only where it supports the delivery and improvement of the service."
        />
      </MarketingSection>

      <PrivacyList
        eyebrow="Information we handle"
        title={
          <>
            The main categories of information used to <em>operate the service</em>
          </>
        }
        items={informationCategories}
      />

      <PrivacyList
        eyebrow="How information is used"
        title={
          <>
            Information use is tied to <em>service delivery and support</em>
          </>
        }
        items={usageCategories}
      />

      <PrivacyList
        eyebrow="Data handling principles"
        title={
          <>
            The privacy posture is designed to stay <em>practical and reviewable</em>
          </>
        }
        items={handlingPrinciples}
      />

      <MarketingFinalCta
        eyebrow="Privacy enquiries"
        title={
          <>
            Need more detail on privacy or the wider <em>control posture</em>?
          </>
        }
        description="Privacy is supported by the wider approach Renovo takes to compliance, access control, hosting, audit trail design, and responsible information handling."
        primaryHref="/contact"
        primaryLabel="Talk to us"
        secondaryHref="/compliance"
        secondaryLabel="View compliance"
      />
    </MarketingShell>
  )
}
