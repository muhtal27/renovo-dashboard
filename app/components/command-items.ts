import {
  BarChart3,
  BookOpenText,
  Building2,
  ClipboardCheck,
  CreditCard,
  Gauge,
  Home,
  Landmark,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'

export type CommandItem = {
  id: string
  label: string
  description?: string
  href: string
  icon: typeof Home
  section: string
  keywords: string[]
}

// Prototype ref: public/demo.html:1093-1107
export const COMMAND_ITEMS: CommandItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Portfolio overview',
    href: '/dashboard',
    icon: Home,
    section: 'Navigation',
    keywords: ['home', 'overview', 'portfolio', 'stats'],
  },
  {
    id: 'tenancies',
    label: 'Tenancies',
    description: 'View all tenancy records',
    href: '/tenancies',
    icon: Building2,
    section: 'Navigation',
    keywords: ['property', 'tenant', 'landlord', 'deposit'],
  },
  {
    id: 'communications',
    label: 'Communications',
    description: 'Messages, conversations, and templates',
    href: '/communications',
    icon: MessageSquare,
    section: 'Navigation',
    keywords: ['messages', 'inbox', 'email', 'template', 'conversations'],
  },
  {
    id: 'disputes',
    label: 'Disputes',
    description: 'Disputed cases and contested issues',
    href: '/disputes',
    icon: ClipboardCheck,
    section: 'Navigation',
    keywords: ['dispute', 'contested', 'claim', 'resolution'],
  },
  {
    id: 'reports',
    label: 'Reports',
    description: 'Portfolio analytics and performance',
    href: '/reports',
    icon: BarChart3,
    section: 'Navigation',
    keywords: ['analytics', 'performance', 'metrics', 'stats'],
  },
  {
    id: 'admin',
    label: 'Admin',
    description: 'Case allocation and integrations',
    href: '/admin',
    icon: LayoutDashboard,
    section: 'Management',
    keywords: ['allocation', 'assign', 'intake'],
  },
  {
    id: 'teams',
    label: 'Teams',
    description: 'Manage members and roles',
    href: '/teams/members',
    icon: Users,
    section: 'Management',
    keywords: ['members', 'roles', 'team', 'invite'],
  },
  {
    id: 'intelligence',
    label: 'Intelligence',
    description: 'Portfolio risk and adjudication patterns',
    href: '/intelligence',
    icon: Gauge,
    section: 'Management',
    keywords: ['analytics', 'risk', 'adjudicator', 'insights', 'cohorts'],
  },
  {
    id: 'guidance',
    label: 'Guidance',
    description: 'EOT scheme and evidence guidance',
    href: '/guidance',
    icon: BookOpenText,
    section: 'Resources',
    keywords: ['help', 'knowledge', 'scheme', 'evidence', 'tds', 'dps'],
  },
  {
    id: 'deposit-schemes',
    label: 'Deposit Schemes',
    description: 'Approved UK deposit protection schemes',
    href: '/deposit-scheme',
    icon: Landmark,
    section: 'Resources',
    keywords: ['dps', 'tds', 'mydeposits', 'scheme', 'protection'],
  },
  {
    id: 'whats-new',
    label: "What's New",
    description: 'Release notes and product updates',
    href: '/whats-new',
    icon: Sparkles,
    section: 'Resources',
    keywords: ['changelog', 'release', 'updates', 'notes'],
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Account and workspace settings',
    href: '/settings',
    icon: Settings,
    section: 'Account',
    keywords: ['profile', 'account', 'preferences', 'password'],
  },
  {
    id: 'billing',
    label: 'Billing',
    description: 'Subscription and invoices',
    href: '/account/billing',
    icon: CreditCard,
    section: 'Account',
    keywords: ['subscription', 'invoice', 'payment', 'plan'],
  },
]

export function filterCommandItems(query: string): CommandItem[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return COMMAND_ITEMS

  return COMMAND_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(trimmed) ||
      item.description?.toLowerCase().includes(trimmed) ||
      item.section.toLowerCase().includes(trimmed) ||
      item.keywords.some((keyword) => keyword.includes(trimmed))
  )
}

export function groupCommandItems(items: CommandItem[]): Map<string, CommandItem[]> {
  const grouped = new Map<string, CommandItem[]>()
  for (const item of items) {
    const existing = grouped.get(item.section)
    if (existing) {
      existing.push(item)
    } else {
      grouped.set(item.section, [item])
    }
  }
  return grouped
}
