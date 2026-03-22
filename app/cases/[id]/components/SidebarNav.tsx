import type { WorkspaceSectionKey, WorkspaceSectionStatus } from '@/app/cases/[id]/workspace-types'
import { getSectionDotClass } from '@/app/cases/[id]/workspace-utils'

type SidebarItem = {
  id: WorkspaceSectionKey
  label: string
  href: string
  status: WorkspaceSectionStatus
}

export function SidebarNav({
  items,
  activeSection,
  caseNumber,
  workflowStatus,
}: {
  items: SidebarItem[]
  activeSection: WorkspaceSectionKey
  caseNumber: string | null
  workflowStatus: string | null
}) {
  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
      <nav className="app-surface rounded-[1.8rem] p-3">
        <div className="flex gap-2 overflow-x-auto lg:flex-col">
          {items.map((item) => {
            const active = activeSection === item.id

            return (
              <a
                key={item.id}
                href={item.href}
                className={`flex min-w-max items-center gap-3 rounded-[1.2rem] px-4 py-3 text-sm font-medium transition lg:min-w-0 ${
                  active
                    ? 'border-l-4 border-l-emerald-500 bg-white text-stone-900 shadow-sm'
                    : 'border-l-4 border-l-transparent text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${getSectionDotClass(item.status)}`} />
                <span>{item.label}</span>
              </a>
            )
          })}
        </div>
      </nav>

      <div className="hidden rounded-[1.6rem] border border-stone-200 bg-stone-50/90 px-4 py-4 text-sm text-stone-500 lg:block">
        <p className="font-medium text-stone-700">{caseNumber || 'Unnumbered case'}</p>
        <p className="mt-1 capitalize">{workflowStatus?.replace(/_/g, ' ') || 'No workflow status yet'}</p>
      </div>
    </aside>
  )
}
