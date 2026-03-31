import { EmptyState } from '@/app/operator-ui'
import { StatusBadge, formatDateTime, formatEnumLabel } from '@/app/eot/_components/eot-ui'
import type { OperatorCaseWorkspaceData } from '@/lib/operator-case-workspace-types'

export function MessageThreadCard({
  workspace,
}: {
  workspace: OperatorCaseWorkspaceData
}) {
  if (!workspace.messages.length) {
    return (
      <EmptyState
        title="No messages yet"
        body="Internal notes and stakeholder communication will appear here when the case reaches submission handling."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {workspace.messages.map((message) => (
          <div key={message.id} className="border-b border-zinc-200 px-5 py-4 last:border-b-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge label={formatEnumLabel(message.sender_type)} tone={message.sender_type} />
              <span className="text-xs uppercase tracking-[0.08em] text-zinc-400">
                {formatDateTime(message.created_at)}
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-900 [overflow-wrap:anywhere]">{message.sender_id}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600 [overflow-wrap:anywhere]">
              {message.content}
            </p>
          </div>
        ))}
    </div>
  )
}
