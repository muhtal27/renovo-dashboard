'use client'

import { FileText, Home, Inbox, MessageSquare, User } from 'lucide-react'
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
const ConversationsPanel = dynamic(() =>
  import('./conversations-panel').then((m) => m.ConversationsPanel)
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
  icon: typeof MessageSquare
}[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'conversations', label: 'Conversations', icon: MessageSquare },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'tenant-portal', label: 'Tenant Portal', icon: User },
  { id: 'landlord-portal', label: 'Landlord Portal', icon: Home },
]

const TAB_COMPONENTS: Record<CommunicationHubTab, React.ComponentType> = {
  inbox: InboxPanel,
  conversations: ConversationsPanel,
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
    <div className="animate-fade-in-up space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-900">Communications</h1>
        <p className="mt-1 text-sm text-zinc-500">Messages, conversations, and templates</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 overflow-x-auto border-b border-zinc-200">
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
                'inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-[18px] py-2.5 text-[13px] font-medium transition',
                selected
                  ? 'border-zinc-900 text-zinc-900'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          )
        })}
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
