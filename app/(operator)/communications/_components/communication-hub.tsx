'use client'

import { Inbox, FileText, UserCircle, Building } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/ui'
import {
  normalizeCommunicationHubTab,
  type CommunicationHubTab,
} from '@/lib/communication-hub-types'

const InboxPanel = dynamic(() =>
  import('./inbox-panel').then((m) => m.InboxPanel)
)
const TemplatePanel = dynamic(() =>
  import('./template-panel').then((m) => m.TemplatePanel)
)
const TenantPortalPanel = dynamic(() =>
  import('./tenant-portal-panel').then((m) => m.TenantPortalPanel)
)
const LandlordPortalPanel = dynamic(() =>
  import('./landlord-portal-panel').then((m) => m.LandlordPortalPanel)
)

const HUB_TABS: {
  id: CommunicationHubTab
  label: string
  icon: typeof Inbox
}[] = [
  { id: 'inbox', label: 'Unified Inbox', icon: Inbox },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'tenant-portal', label: 'Tenant Portal', icon: UserCircle },
  { id: 'landlord-portal', label: 'Landlord Portal', icon: Building },
]

const TAB_COMPONENTS: Record<
  CommunicationHubTab,
  React.ComponentType
> = {
  inbox: InboxPanel,
  templates: TemplatePanel,
  'tenant-portal': TenantPortalPanel,
  'landlord-portal': LandlordPortalPanel,
}

export function CommunicationHub({
  initialTab,
}: {
  initialTab: CommunicationHubTab
}) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeTab = normalizeCommunicationHubTab(
    searchParams.get('tab') ?? initialTab
  )
  const ActiveComponent = TAB_COMPONENTS[activeTab]

  const handleTabChange = useCallback(
    (tab: CommunicationHubTab) => {
      if (!pathname) return
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString())
        if (tab === 'inbox') {
          params.delete('tab')
        } else {
          params.set('tab', tab)
        }
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        })
      })
    },
    [pathname, router, searchParams, startTransition]
  )

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
            Communications
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
            Communication Hub
          </h1>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-zinc-200/60">
        <nav className="flex gap-1 overflow-x-auto" aria-label="Communication sections">
          {HUB_TABS.map((tab) => {
            const Icon = tab.icon
            const selected = tab.id === activeTab

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'inline-flex min-h-11 items-center gap-2 border-b-2 px-4 pb-3 pt-2 text-sm font-medium whitespace-nowrap transition',
                  selected
                    ? 'border-emerald-600 text-zinc-950'
                    : 'border-transparent text-zinc-500 hover:text-zinc-900'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div
        aria-busy={isPending}
        className={cn(isPending ? 'opacity-80' : null)}
      >
        <ActiveComponent />
      </div>
    </div>
  )
}
