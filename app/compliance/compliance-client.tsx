import { MarketingFinalCta, MarketingIntro, MarketingRuleList, MarketingSection } from '@/app/components/marketing-ui'
import { MarketingShell } from '@/app/components/MarketingShell'

const sections = [
  {
    eyebrow: 'Infrastructure',
    title: 'Data hosting and',
    emphasis: 'residency',
    rows: [
      { label: 'Hosting region', detail: 'All production data hosted in London, United Kingdom. No tenancy or case data leaves the UK.' },
      { label: 'Infrastructure', detail: 'Cloud infrastructure managed through Supabase (AWS eu-west-2) with encryption at rest and in transit.' },
      { label: 'Application hosting', detail: 'Frontend and API services deployed on Vercel with London region routing (lhr1).' },
      { label: 'Backups', detail: 'Automated daily backups with point-in-time recovery. Backup data remains within the same hosting region.' },
    ],
  },
  {
    eyebrow: 'Access control',
    title: 'Authentication and',
    emphasis: 'authorisation',
    rows: [
      { label: 'Authentication', detail: 'SSO via Microsoft Entra ID (Azure AD). Staff sign in with existing agency credentials. No separate passwords.' },
      { label: 'Role-based access', detail: 'Platform permissions scoped by role and branch. Operators see assigned cases. Managers see portfolio-level data.' },
      { label: 'Session management', detail: 'Sessions are time-limited with automatic expiry. Re-authentication required after inactivity.' },
      { label: 'SSO add-on', detail: 'SAML-based identity providers supported as an optional add-on for agencies not on Microsoft 365.' },
    ],
  },
  {
    eyebrow: 'Privacy',
    title: 'UK GDPR and',
    emphasis: 'data protection',
    rows: [
      { label: 'Legal basis', detail: 'Personal data processed under legitimate interest and contractual necessity for the letting agency as data controller.' },
      { label: 'Data categories', detail: 'Tenant names, tenancy addresses, deposit amounts, checkout evidence (photographs, reports), and case decisions.' },
      { label: 'AI processing', detail: 'Tenancy data processed by AI to draft liability assessments. Not used to train models or shared with third parties.' },
      { label: 'Subject rights', detail: 'Data subject access, erasure, and portability requests handled within statutory timescales.' },
      { label: 'Privacy notice', detail: 'Full privacy notice at renovoai.co.uk/privacy. Data protection enquiries to hello@renovoai.co.uk.' },
    ],
  },
  {
    eyebrow: 'Audit and retention',
    title: 'Traceability and',
    emphasis: 'record keeping',
    rows: [
      { label: 'Audit trail', detail: 'Every case action, edit, approval, rejection, and note logged with a timestamp and the name of the person.' },
      { label: 'Immutability', detail: 'Audit records cannot be edited or deleted by platform users. Supports scheme-level scrutiny if disputed.' },
      { label: 'Retention', detail: 'Standard retention is 3 years. Enterprise customers can configure custom retention periods.' },
      { label: 'Deletion', detail: 'On contract termination, customer data deleted within 90 days unless a longer period is required by law.' },
    ],
  },
  {
    eyebrow: 'Subprocessors',
    title: 'Third-party',
    emphasis: 'services',
    rows: [
      { label: 'Supabase', detail: 'Database hosting, authentication, and file storage. London region (eu-west-2).' },
      { label: 'Vercel', detail: 'Application hosting and edge delivery. London region (lhr1).' },
      { label: 'Anthropic', detail: 'AI processing for liability assessment drafting. Data processed under DPA. Not used for model training.' },
      { label: 'Microsoft', detail: 'Identity provider for SSO authentication via Entra ID.' },
    ],
  },
] as const

export default function ComplianceClient() {
  return (
    <MarketingShell currentPath="/compliance">
      <MarketingSection>
        <MarketingIntro
          titleAs="h1"
          eyebrow="Compliance"
          title={
            <>
              Security, privacy, and <em>data handling</em>
            </>
          }
          description="Renovo AI processes tenancy evidence, liability assessments, and deposit decisions. This page outlines how that data is hosted, accessed, retained, and protected."
        />
      </MarketingSection>

      {sections.map((section, index) => (
        <MarketingSection key={section.eyebrow} variant={index % 2 === 0 ? 'tint' : 'default'}>
          <div className="max-w-[56rem]">
            <p className="marketing-eyebrow">{section.eyebrow}</p>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.045em] text-[var(--text-strong)]">
              {section.title} <em>{section.emphasis}</em>
            </h2>
          </div>
          <MarketingRuleList>
            {section.rows.map((row) => (
              <div key={row.label} className="grid gap-3 py-5 md:grid-cols-[180px_minmax(0,1fr)] md:gap-6">
                <p className="text-sm font-semibold text-[var(--text-strong)]">{row.label}</p>
                <p className="text-sm leading-7 text-[var(--text-body)]">{row.detail}</p>
              </div>
            ))}
          </MarketingRuleList>
        </MarketingSection>
      ))}

      <MarketingSection>
        <div className="grid gap-8 md:grid-cols-4">
          {[
            { label: 'Company', value: 'Renovo AI Ltd' },
            { label: 'Registered', value: 'Edinburgh, Scotland' },
            { label: 'Company number', value: 'SC833544' },
            { label: 'VAT', value: 'GB483379648' },
          ].map((detail) => (
            <div key={detail.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-soft)]">{detail.label}</p>
              <p className="mt-2 text-sm text-[var(--text-strong)]">{detail.value}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-[var(--text-body)]">
          For procurement, onboarding, or compliance enquiries contact{' '}
          <a href="mailto:hello@renovoai.co.uk" className="text-[var(--accent-emerald-strong)] hover:underline">
            hello@renovoai.co.uk
          </a>
        </p>
      </MarketingSection>

      <MarketingFinalCta
        eyebrow="Internal review"
        title={
          <>
            Need compliance detail for <em>internal review</em>?
          </>
        }
        description="Contact us for DPA documentation, security questionnaire responses, or additional technical detail."
        primaryHref="/contact"
        primaryLabel="Talk to us"
        secondaryHref="mailto:hello@renovoai.co.uk?subject=Compliance%20enquiry"
        secondaryLabel="Email Renovo AI"
      />
    </MarketingShell>
  )
}
