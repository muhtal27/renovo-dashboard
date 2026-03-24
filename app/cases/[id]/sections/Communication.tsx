'use client'

import { useMemo, useState } from 'react'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import type {
  CaseCommunicationAttachment,
  CaseCommunicationRecord,
  EndOfTenancyWorkspacePayload,
} from '@/lib/end-of-tenancy/types'
import type { WorkspaceContact } from '@/app/cases/[id]/workspace-types'
import { formatDateTime } from '@/app/cases/[id]/workspace-utils'

function getContactName(contact: WorkspaceContact | null) {
  return (
    contact?.full_name?.trim() ||
    contact?.company_name?.trim() ||
    contact?.email?.trim() ||
    contact?.phone?.trim() ||
    'Unknown'
  )
}

function getRecipientLabel(
  communication: CaseCommunicationRecord,
  tenant: WorkspaceContact | null,
  landlord: WorkspaceContact | null
) {
  if (communication.recipient_role === 'internal') {
    return 'Internal note'
  }

  if (communication.recipient_role === 'tenant') {
    return getContactName(tenant)
  }

  if (communication.recipient_role === 'landlord') {
    return getContactName(landlord)
  }

  return communication.recipient_name || 'Unknown'
}

function getSenderLabel(
  communication: CaseCommunicationRecord,
  actorNames: Record<string, string>,
  tenant: WorkspaceContact | null,
  landlord: WorkspaceContact | null
) {
  if (communication.sender_user_id) {
    return actorNames[communication.sender_user_id] || communication.sender_name || 'Manager'
  }

  if (communication.sender_contact_id === tenant?.id) {
    return getContactName(tenant)
  }

  if (communication.sender_contact_id === landlord?.id) {
    return getContactName(landlord)
  }

  return communication.sender_name || 'External contact'
}

function getDirectionBadgeClass(direction: string, recipientRole: string) {
  if (recipientRole === 'internal') {
    return 'border border-violet-200 bg-violet-50 text-violet-800'
  }

  if (direction === 'inbound') {
    return 'border border-amber-200 bg-amber-50 text-amber-800'
  }

  return 'border border-sky-200 bg-sky-50 text-sky-800'
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'read':
    case 'delivered':
      return 'border border-emerald-200 bg-emerald-50 text-emerald-800'
    case 'queued':
    case 'received':
      return 'border border-amber-200 bg-amber-50 text-amber-800'
    case 'failed':
      return 'border border-red-200 bg-red-50 text-red-800'
    default:
      return 'border border-stone-200 bg-stone-100 text-stone-700'
  }
}

function parseAttachments(value: unknown) {
  if (!Array.isArray(value)) return []

  return value.filter((item): item is CaseCommunicationAttachment => {
    return typeof item === 'object' && item != null
  })
}

export function Communication({
  endOfTenancyCaseId,
  workspace,
  communications,
  tenant,
  landlord,
  actorNames,
  onRefresh,
}: {
  endOfTenancyCaseId: string
  workspace: EndOfTenancyWorkspacePayload
  communications: CaseCommunicationRecord[]
  tenant: WorkspaceContact | null
  landlord: WorkspaceContact | null
  actorNames: Record<string, string>
  onRefresh: () => Promise<void>
}) {
  const [recipientRole, setRecipientRole] = useState<'tenant' | 'landlord' | 'internal'>('tenant')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [markingReadId, setMarkingReadId] = useState<string | null>(null)

  const timeline = useMemo(
    () =>
      [...communications].sort((left, right) =>
        (left.created_at || '').localeCompare(right.created_at || '')
      ),
    [communications]
  )

  const unreadCount = communications.filter((item) => item.unread).length
  const internalCount = communications.filter((item) => item.recipient_role === 'internal').length
  const externalCount = communications.length - internalCount

  async function handleSubmit() {
    if (!body.trim()) {
      setError('Add a message or note before sending.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await endOfTenancyApiRequest(`/api/eot/cases/${endOfTenancyCaseId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_communication',
          direction: recipientRole === 'internal' ? 'internal' : 'outbound',
          channel: recipientRole === 'internal' ? 'internal_note' : 'email',
          recipientRole,
          subject: subject.trim() || null,
          body: body.trim(),
          attachments: workspace.documents
            .filter((document) => selectedDocumentIds.includes(document.id))
            .map((document) => ({
              caseDocumentId: document.id,
              fileName: document.file_name,
              fileUrl: document.file_url,
              documentRole: document.document_role,
            })),
        }),
      })

      setSubject('')
      setBody('')
      setSelectedDocumentIds([])
      await onRefresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the communication entry right now.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkRead(communicationId: string) {
    setMarkingReadId(communicationId)
    setError(null)

    try {
      await endOfTenancyApiRequest(`/api/eot/cases/${endOfTenancyCaseId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'mark_communication_read',
          communicationId,
        }),
      })

      await onRefresh()
    } catch (markReadError) {
      setError(
        markReadError instanceof Error
          ? markReadError.message
          : 'Unable to update message state right now.'
      )
    } finally {
      setMarkingReadId(null)
    }
  }

  return (
    <section id="communication" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="app-kicker">Communication</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Case communication hub
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
            Send messages to the landlord or tenant from inside the case, keep internal notes
            separate, and retain one timeline for review and challenge.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-4">
            <p className="app-kicker">Unread</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{unreadCount}</p>
          </div>
          <div className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-4">
            <p className="app-kicker">External</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{externalCount}</p>
          </div>
          <div className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-4">
            <p className="app-kicker">Internal notes</p>
            <p className="mt-2 text-2xl font-semibold text-stone-900">{internalCount}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <div className="space-y-4">
          {timeline.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50 px-5 py-8 text-center">
              <p className="text-sm font-medium text-stone-700">No case communication recorded yet</p>
              <p className="mt-2 text-sm text-stone-500">
                Outbound messages, inbound replies, and staff-only notes will appear here.
              </p>
            </div>
          ) : (
            timeline.map((communication) => {
              const attachments = parseAttachments(communication.attachments)

              return (
                <article
                  key={communication.id}
                  className="rounded-[1.6rem] border border-stone-200 bg-white px-5 py-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getDirectionBadgeClass(
                            communication.direction,
                            communication.recipient_role
                          )}`}
                        >
                          {communication.recipient_role === 'internal'
                            ? 'Internal note'
                            : communication.direction}
                        </span>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                            communication.status
                          )}`}
                        >
                          {communication.status}
                        </span>
                        {communication.unread ? (
                          <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
                            Unread
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-semibold text-stone-900">
                        {getSenderLabel(communication, actorNames, tenant, landlord)} to{' '}
                        {getRecipientLabel(communication, tenant, landlord)}
                      </p>
                      {communication.subject ? (
                        <p className="mt-1 text-sm text-stone-700">{communication.subject}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs text-stone-500">
                      <p>{formatDateTime(communication.sent_at || communication.created_at)}</p>
                      <p className="mt-1 uppercase tracking-[0.16em]">
                        {communication.channel.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-stone-700">{communication.body}</p>

                  {attachments.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {attachments.map((attachment, index) => (
                        <span
                          key={`${communication.id}-${attachment.case_document_id || index}`}
                          className="inline-flex rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600"
                        >
                          {attachment.file_name || attachment.document_role || 'Attachment'}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {communication.unread ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => void handleMarkRead(communication.id)}
                        disabled={markingReadId === communication.id}
                        className="inline-flex rounded-full border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900 disabled:opacity-60"
                      >
                        {markingReadId === communication.id ? 'Updating...' : 'Mark as read'}
                      </button>
                    </div>
                  ) : null}
                </article>
              )
            })
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
            <p className="app-kicker">Compose</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">Add a case communication</h3>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Internal notes stay staff-only. External messages are saved against the case and can
              be handed off to delivery integration separately.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Recipient
                </span>
                <select
                  value={recipientRole}
                  onChange={(event) =>
                    setRecipientRole(event.target.value as 'tenant' | 'landlord' | 'internal')
                  }
                  className="app-field w-full rounded-[1rem] px-4 py-3 text-sm text-stone-700"
                >
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Landlord</option>
                  <option value="internal">Internal</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Subject
                </span>
                <input
                  type="text"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={
                    recipientRole === 'internal'
                      ? 'Optional internal note title'
                      : 'Optional message subject'
                  }
                  className="app-field w-full rounded-[1rem] px-4 py-3 text-sm text-stone-700"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Message
                </span>
                <textarea
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  rows={6}
                  placeholder={
                    recipientRole === 'internal'
                      ? 'Add a staff-only note for this case'
                      : `Write the message for the ${recipientRole}`
                  }
                  className="app-field w-full rounded-[1.2rem] px-4 py-3 text-sm text-stone-700"
                />
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Attachments
                </span>
                <div className="max-h-56 space-y-2 overflow-y-auto rounded-[1.2rem] border border-stone-200 bg-stone-50 p-3">
                  {workspace.documents.length === 0 ? (
                    <p className="text-sm text-stone-500">No case documents are available yet.</p>
                  ) : (
                    workspace.documents.map((document) => {
                      const checked = selectedDocumentIds.includes(document.id)

                      return (
                        <label
                          key={document.id}
                          className="flex items-start gap-3 rounded-[1rem] bg-white px-3 py-3 text-sm text-stone-700"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedDocumentIds((current) =>
                                event.target.checked
                                  ? [...current, document.id]
                                  : current.filter((item) => item !== document.id)
                              )
                            }}
                            className="mt-0.5 h-4 w-4 rounded border-stone-300 text-stone-900 focus:ring-stone-500"
                          />
                          <span>
                            <span className="block font-medium text-stone-900">
                              {document.file_name || document.document_role.replace(/_/g, ' ')}
                            </span>
                            <span className="mt-1 block text-xs text-stone-500">
                              {document.document_role.replace(/_/g, ' ')}
                            </span>
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              {error ? (
                <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={submitting}
                className="app-primary-button w-full rounded-full px-4 py-3 text-sm font-medium disabled:opacity-60"
              >
                {submitting
                  ? 'Saving...'
                  : recipientRole === 'internal'
                    ? 'Save internal note'
                    : 'Queue message in case'}
              </button>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
            <p className="app-kicker">Case communication rules</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
              <li>Internal notes remain staff-only and are never shown to the landlord or tenant.</li>
              <li>External messages are labelled clearly and tied back to the case audit record.</li>
              <li>Attachments added here remain linked to the underlying case evidence.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}
