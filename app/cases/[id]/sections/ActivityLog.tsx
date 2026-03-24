import type {
  CaseCommunicationAttachment,
  CaseCommunicationRecord,
  MoveOutTrackerEventRow,
} from '@/lib/end-of-tenancy/types'
import type { WorkspaceContact } from '@/app/cases/[id]/workspace-types'
import { formatDateTime } from '@/app/cases/[id]/workspace-utils'

type TimelineItem =
  | {
      kind: 'event'
      id: string
      title: string
      detail: string | null
      createdAt: string
      badge: string
      tone: string
    }
  | {
      kind: 'communication'
      id: string
      title: string
      detail: string
      createdAt: string
      badge: string
      tone: string
      attachments: CaseCommunicationAttachment[]
    }

function getContactName(contact: WorkspaceContact | null) {
  return (
    contact?.full_name?.trim() ||
    contact?.company_name?.trim() ||
    contact?.email?.trim() ||
    contact?.phone?.trim() ||
    'Unknown'
  )
}

function parseAttachments(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is CaseCommunicationAttachment => {
    return typeof item === 'object' && item != null
  })
}

function getCommunicationTitle(
  communication: CaseCommunicationRecord,
  actorNames: Record<string, string>,
  tenant: WorkspaceContact | null,
  landlord: WorkspaceContact | null
) {
  const sender =
    communication.sender_user_id
      ? actorNames[communication.sender_user_id] || communication.sender_name || 'Manager'
      : communication.sender_contact_id === tenant?.id
        ? getContactName(tenant)
        : communication.sender_contact_id === landlord?.id
          ? getContactName(landlord)
          : communication.sender_name || 'External contact'

  const recipient =
    communication.recipient_role === 'internal'
      ? 'internal note'
      : communication.recipient_role === 'tenant'
        ? getContactName(tenant)
        : communication.recipient_role === 'landlord'
          ? getContactName(landlord)
          : communication.recipient_name || 'contact'

  if (communication.recipient_role === 'internal') {
    return `${sender} added an internal note`
  }

  if (communication.direction === 'inbound') {
    return `${sender} replied on the case`
  }

  return `${sender} sent a message to ${recipient}`
}

export function ActivityLog({
  events,
  communications,
  actorNames,
  tenant,
  landlord,
}: {
  events: MoveOutTrackerEventRow[]
  communications: CaseCommunicationRecord[]
  actorNames: Record<string, string>
  tenant: WorkspaceContact | null
  landlord: WorkspaceContact | null
}) {
  const timeline: TimelineItem[] = [
    ...events.map<TimelineItem>((event) => ({
      kind: 'event',
      id: event.id,
      title: event.title,
      detail: event.detail,
      createdAt: event.created_at,
      badge: event.event_type.replace(/_/g, ' '),
      tone: 'border border-stone-200 bg-stone-100 text-stone-700',
    })),
    ...communications.map<TimelineItem>((communication) => ({
      kind: 'communication',
      id: communication.id,
      title: getCommunicationTitle(communication, actorNames, tenant, landlord),
      detail: communication.subject?.trim()
        ? `${communication.subject} · ${communication.body}`
        : communication.body,
      createdAt: communication.sent_at || communication.created_at,
      badge:
        communication.recipient_role === 'internal'
          ? 'internal note'
          : `${communication.direction} ${communication.channel}`.replace(/_/g, ' '),
      tone:
        communication.recipient_role === 'internal'
          ? 'border border-violet-200 bg-violet-50 text-violet-800'
          : communication.direction === 'inbound'
            ? 'border border-amber-200 bg-amber-50 text-amber-800'
            : 'border border-sky-200 bg-sky-50 text-sky-800',
      attachments: parseAttachments(communication.attachments),
    })),
  ].sort((left, right) => (right.createdAt || '').localeCompare(left.createdAt || ''))

  return (
    <section id="activity" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div>
        <p className="app-kicker">Activity log</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Audit trail across workflow and communication
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Every checklist change, recommendation step, and communication entry is held in one
          timeline so the case can be reviewed or challenged later.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {timeline.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-stone-700">No activity recorded yet</p>
            <p className="mt-2 text-sm text-stone-500">
              Events and communication entries will appear here as the case moves forward.
            </p>
          </div>
        ) : (
          timeline.map((item) => (
            <article
              key={`${item.kind}-${item.id}`}
              className="rounded-[1.5rem] border border-stone-200 bg-white px-5 py-5"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${item.tone}`}
                  >
                    {item.badge}
                  </span>
                  <p className="mt-3 text-sm font-semibold text-stone-900">{item.title}</p>
                </div>
                <p className="text-xs text-stone-500">{formatDateTime(item.createdAt)}</p>
              </div>

              {item.detail ? (
                <p className="mt-4 text-sm leading-6 text-stone-700">{item.detail}</p>
              ) : null}

              {item.kind === 'communication' && item.attachments.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.attachments.map((attachment, index) => (
                    <span
                      key={`${item.id}-${attachment.case_document_id || index}`}
                      className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600"
                    >
                      {attachment.file_name || attachment.document_role || 'Attachment'}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  )
}
