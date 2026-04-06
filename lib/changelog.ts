/**
 * Changelog entries — add new releases at the TOP of the array.
 *
 * Each entry has:
 *  - version:  semver string shown as the release tag
 *  - date:     ISO date string (YYYY-MM-DD)
 *  - title:    short headline for the release
 *  - summary:  one-liner shown in the list view
 *  - changes:  grouped by category
 */

export type ChangelogCategory = 'added' | 'improved' | 'fixed' | 'removed'

export type ChangelogEntry = {
  version: string
  date: string
  title: string
  summary: string
  changes: Array<{
    category: ChangelogCategory
    items: string[]
  }>
}

export const CATEGORY_META: Record<
  ChangelogCategory,
  { label: string; color: string; dot: string }
> = {
  added: { label: 'Added', color: 'text-emerald-700 bg-emerald-50', dot: 'bg-emerald-500' },
  improved: { label: 'Improved', color: 'text-sky-700 bg-sky-50', dot: 'bg-sky-500' },
  fixed: { label: 'Fixed', color: 'text-amber-700 bg-amber-50', dot: 'bg-amber-500' },
  removed: { label: 'Removed', color: 'text-zinc-600 bg-zinc-100', dot: 'bg-zinc-400' },
}

// ---------------------------------------------------------------------------
// Releases — newest first
// ---------------------------------------------------------------------------

export const changelog: ChangelogEntry[] = [
  {
    version: '1.5.0',
    date: '2026-04-06',
    title: 'Editable defect review in case workspace',
    summary:
      'Operators can now override AI liability assignments, adjust costs, and exclude defects directly in the Review step before sending the draft report.',
    changes: [
      {
        category: 'added',
        items: [
          'Inline defect editing in Review step — toggle liability (tenant/landlord/shared), adjust costs, and exclude items',
          'Live claim summary with tenant liability, landlord cost, shared cost, and deposit comparison',
          'Deposit vs claim warning when tenant liability exceeds the deposit held',
          'Save review overrides with one-click persistence to the database',
          'Reset button to restore all defects to AI-suggested values',
        ],
      },
      {
        category: 'improved',
        items: [
          'Review step now shows AI reasoning and confidence alongside editable fields',
          'Original AI claim breakdown preserved as reference below operator overrides',
        ],
      },
    ],
  },
  {
    version: '1.4.0',
    date: '2026-04-06',
    title: 'Unmatched email review & design consistency',
    summary:
      'Operators can now review and attach unmatched inbound emails directly from Settings. Disputes and Inventory Feedback pages redesigned to match the rest of the dashboard.',
    changes: [
      {
        category: 'added',
        items: [
          'Interactive unmatched email review queue in Email Ingestion settings — view email details, search tenancies, and attach in one click',
        ],
      },
      {
        category: 'improved',
        items: [
          'Disputes page redesigned with row-based layout, ToolbarPill tabs, and inline KPI stats',
          'Inventory Feedback page redesigned to match clean dashboard design language',
          'Inventory Feedback now loads via a single aggregated API call instead of N+1 requests',
          'Renamed "Reports / Analytics" to "Reports" across the dashboard',
        ],
      },
      {
        category: 'removed',
        items: [
          'Deposit Scheme tab removed from sidebar navigation',
        ],
      },
    ],
  },
  {
    version: '1.3.0',
    date: '2026-04-06',
    title: 'Case workspace redesign',
    summary:
      'Rebuilt the case workspace with a competitor-style step bar using domain-specific EOT steps: Inventory, Checkout, Readings, Analysis, Review, Deductions, Refund.',
    changes: [
      {
        category: 'improved',
        items: [
          'Case workspace step bar redesigned with visual icon circles, connecting lines, and clear progress indicators',
          'Steps now follow industry-standard EOT workflow instead of internal process states',
        ],
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2026-04-05',
    title: 'Email ingestion system',
    summary:
      'Receive inventory reports via email at your dedicated address. Auto-matches to properties using sender, postcode, and address parsing.',
    changes: [
      {
        category: 'added',
        items: [
          'Inbound email ingestion via Resend webhooks at *@in.renovoai.co.uk',
          'Auto-matching engine using sender email, UK postcodes, and address fuzzy matching',
          'Automatic attachment upload to Supabase Storage and linking to open cases',
          'Email Ingestion settings tab with configuration, activity log, and unmatched queue',
        ],
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2026-04-05',
    title: 'PWA and mobile experience',
    summary:
      'Native app feel with PWA splash screen, touch polish, offline indicator, and quick shortcuts.',
    changes: [
      {
        category: 'added',
        items: [
          'Native splash screen for standalone PWA mode',
          'Offline/online connection status bar',
          'PWA shortcuts for Tenancies, Disputes, Dashboard, and Deposits',
        ],
      },
      {
        category: 'improved',
        items: [
          'Disabled tap highlight and rubber-band bounce for native feel',
          'Instant taps with touch-action: manipulation (no 300ms delay)',
          'Edge-to-edge viewport with safe-area insets',
        ],
      },
    ],
  },
  {
    version: '1.0.0',
    date: '2026-04-04',
    title: 'Initial release',
    summary:
      'End-of-tenancy automation platform for UK letting agencies with full case management, tenancy dashboard, dispute tracking, and team management.',
    changes: [
      {
        category: 'added',
        items: [
          'Operator dashboard with tenancy management and case workspace',
          'Automated evidence analysis and deduction recommendations',
          'Dispute tracking with priority-based workflow',
          'Inventory feedback aggregation across all cases',
          'Team management with role-based access control',
          'Reports and analytics for portfolio performance',
          'Guidance library for EOT best practices',
          'Portfolio-based pricing with billing management',
        ],
      },
    ],
  },
]

/** Latest release — used for "What\'s new" indicators */
export const latestRelease = changelog[0]
