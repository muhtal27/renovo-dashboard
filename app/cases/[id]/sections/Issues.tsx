'use client'

import { useMemo, useState } from 'react'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import type { EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'
import {
  formatLabel,
  formatMoney,
  getIssueStatusTone,
  getResponsibilityTone,
  getSeverityTone,
  toNumber,
} from '@/app/cases/[id]/workspace-utils'

const ISSUE_TYPE_OPTIONS = [
  'cleaning',
  'damage',
  'missing_item',
  'repair',
  'redecoration',
  'gardening',
  'rubbish_removal',
  'rent_arrears',
  'utilities',
  'other',
] as const

const RESPONSIBILITY_OPTIONS = ['tenant', 'landlord', 'shared', 'undetermined'] as const
const SEVERITY_OPTIONS = ['high', 'medium', 'low'] as const
const STATUS_OPTIONS = ['open', 'under_review', 'accepted', 'rejected', 'resolved'] as const

type IssueFormState = {
  issueType: (typeof ISSUE_TYPE_OPTIONS)[number]
  title: string
  description: string
  roomArea: string
  responsibility: (typeof RESPONSIBILITY_OPTIONS)[number]
  severity: (typeof SEVERITY_OPTIONS)[number]
  proposedAmount: string
  status: (typeof STATUS_OPTIONS)[number]
}

const EMPTY_ISSUE_FORM: IssueFormState = {
  issueType: 'damage',
  title: '',
  description: '',
  roomArea: '',
  responsibility: 'undetermined',
  severity: 'medium',
  proposedAmount: '',
  status: 'open',
}

function buildFormState(issue?: EndOfTenancyWorkspacePayload['issues'][number]): IssueFormState {
  if (!issue) return EMPTY_ISSUE_FORM

  return {
    issueType: issue.issue_type,
    title: issue.title,
    description: issue.description || '',
    roomArea: issue.room_area || '',
    responsibility: issue.responsibility,
    severity: issue.severity,
    proposedAmount:
      issue.proposed_amount == null ? '' : String(issue.proposed_amount),
    status: issue.status,
  }
}

export function Issues({
  endOfTenancyCaseId,
  issues,
  onRefresh,
}: {
  endOfTenancyCaseId: string
  issues: EndOfTenancyWorkspacePayload['issues']
  onRefresh: () => Promise<void>
}) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [createForm, setCreateForm] = useState<IssueFormState>(EMPTY_ISSUE_FORM)
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<IssueFormState>(EMPTY_ISSUE_FORM)
  const [expandedIssues, setExpandedIssues] = useState<Record<string, boolean>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sortedIssues = useMemo(
    () =>
      [...issues].sort((left, right) =>
        (right.updated_at || '').localeCompare(left.updated_at || '')
      ),
    [issues]
  )

  const totalProposedAmount = useMemo(
    () =>
      sortedIssues.reduce((sum, issue) => {
        if (issue.responsibility === 'landlord') return sum
        return sum + (toNumber(issue.proposed_amount) ?? 0)
      }, 0),
    [sortedIssues]
  )

  function updateCreateForm(field: keyof IssueFormState, value: string) {
    setCreateForm((current) => ({ ...current, [field]: value }))
  }

  function updateEditForm(field: keyof IssueFormState, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  async function handleCreateIssue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await endOfTenancyApiRequest(`/api/eot/cases/${endOfTenancyCaseId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_issue',
          issueType: createForm.issueType,
          title: createForm.title,
          description: createForm.description.trim() || null,
          roomArea: createForm.roomArea.trim() || null,
          responsibility: createForm.responsibility,
          severity: createForm.severity,
          proposedAmount: createForm.proposedAmount.trim()
            ? Number(createForm.proposedAmount)
            : null,
        }),
      })

      setCreateForm(EMPTY_ISSUE_FORM)
      setShowAddForm(false)
      await onRefresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to add the issue.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleUpdateIssue(issueId: string) {
    setSubmitting(true)
    setError(null)

    try {
      await endOfTenancyApiRequest(`/api/eot/cases/${endOfTenancyCaseId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_issue',
          issueId,
          issueType: editForm.issueType,
          title: editForm.title,
          description: editForm.description.trim() || null,
          roomArea: editForm.roomArea.trim() || null,
          responsibility: editForm.responsibility,
          severity: editForm.severity,
          proposedAmount: editForm.proposedAmount.trim() ? Number(editForm.proposedAmount) : null,
          status: editForm.status,
        }),
      })

      setEditingIssueId(null)
      await onRefresh()
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Unable to update the issue.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="issues" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="app-kicker">Issues</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Responsibility and proposed amounts
          </h2>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-600">
          Total proposed amount {formatMoney(totalProposedAmount)}
        </div>
      </div>

      <div className="app-divider my-6" />

      {sortedIssues.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10 text-sm text-stone-500">
          No issues have been recorded yet. Add the first issue manually or generate a recommendation after the evidence pack is ready.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedIssues.map((issue) => {
            const isExpanded = expandedIssues[issue.id] ?? false
            const isEditing = editingIssueId === issue.id
            const shortDescription =
              issue.description && issue.description.length > 180
                ? `${issue.description.slice(0, 180)}...`
                : issue.description

            return (
              <article key={issue.id} className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-stone-900">{issue.title}</h3>
                      <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                        {formatLabel(issue.issue_type)}
                      </span>
                      {issue.room_area ? (
                        <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                          {issue.room_area}
                        </span>
                      ) : null}
                    </div>

                    <p className="max-w-3xl text-sm leading-6 text-stone-600">
                      {isExpanded ? issue.description || 'No description provided.' : shortDescription || 'No description provided.'}
                    </p>

                    {issue.description && issue.description.length > 180 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedIssues((current) => ({
                            ...current,
                            [issue.id]: !isExpanded,
                          }))
                        }
                        className="text-sm font-medium text-stone-700 underline-offset-4 hover:underline"
                      >
                        {isExpanded ? 'Show less' : 'Show more'}
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getResponsibilityTone(issue.responsibility)}`}>
                      {formatLabel(issue.responsibility)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getSeverityTone(issue.severity)}`}>
                      {formatLabel(issue.severity)}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getIssueStatusTone(issue.status)}`}>
                      {formatLabel(issue.status)}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                      {issue.evidence.length} evidence link{issue.evidence.length === 1 ? '' : 's'}
                    </span>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                      {formatMoney(issue.proposed_amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIssueId(issue.id)
                        setEditForm(buildFormState(issue))
                      }}
                      className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                    >
                      Edit
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-5 grid gap-4 rounded-[1.4rem] border border-stone-200 bg-stone-50/70 p-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Issue type</label>
                      <select
                        value={editForm.issueType}
                        onChange={(event) => updateEditForm('issueType', event.target.value)}
                        className="app-field w-full"
                      >
                        {ISSUE_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {formatLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Title</label>
                      <input
                        value={editForm.title}
                        onChange={(event) => updateEditForm('title', event.target.value)}
                        className="app-field w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Room / area</label>
                      <input
                        value={editForm.roomArea}
                        onChange={(event) => updateEditForm('roomArea', event.target.value)}
                        className="app-field w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Proposed amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.proposedAmount}
                        onChange={(event) => updateEditForm('proposedAmount', event.target.value)}
                        className="app-field w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Responsibility</label>
                      <select
                        value={editForm.responsibility}
                        onChange={(event) => updateEditForm('responsibility', event.target.value)}
                        className="app-field w-full"
                      >
                        {RESPONSIBILITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {formatLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Severity</label>
                      <select
                        value={editForm.severity}
                        onChange={(event) => updateEditForm('severity', event.target.value)}
                        className="app-field w-full"
                      >
                        {SEVERITY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {formatLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-stone-800">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={(event) => updateEditForm('description', event.target.value)}
                        rows={4}
                        className="app-field w-full resize-y"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-stone-800">Status</label>
                      <select
                        value={editForm.status}
                        onChange={(event) => updateEditForm('status', event.target.value)}
                        className="app-field w-full"
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {formatLabel(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingIssueId(null)}
                        className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleUpdateIssue(issue.id)}
                        disabled={submitting}
                        className="app-primary-button rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
                      >
                        {submitting ? 'Saving...' : 'Save issue'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            )
          })}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {!showAddForm ? (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="app-primary-button rounded-full px-5 py-3 text-sm font-medium"
            >
              Add issue manually
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreateIssue} className="grid gap-4 rounded-[1.6rem] border border-stone-200 bg-stone-50/70 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">Issue type</label>
              <select
                value={createForm.issueType}
                onChange={(event) => updateCreateForm('issueType', event.target.value)}
                className="app-field w-full"
              >
                {ISSUE_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">Title</label>
              <input
                value={createForm.title}
                onChange={(event) => updateCreateForm('title', event.target.value)}
                className="app-field w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">Room / area</label>
              <input
                value={createForm.roomArea}
                onChange={(event) => updateCreateForm('roomArea', event.target.value)}
                className="app-field w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">Proposed amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={createForm.proposedAmount}
                onChange={(event) => updateCreateForm('proposedAmount', event.target.value)}
                className="app-field w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">Responsibility</label>
              <select
                value={createForm.responsibility}
                onChange={(event) => updateCreateForm('responsibility', event.target.value)}
                className="app-field w-full"
              >
                {RESPONSIBILITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-800">Severity</label>
              <select
                value={createForm.severity}
                onChange={(event) => updateCreateForm('severity', event.target.value)}
                className="app-field w-full"
              >
                {SEVERITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {formatLabel(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-stone-800">Description</label>
              <textarea
                value={createForm.description}
                onChange={(event) => updateCreateForm('description', event.target.value)}
                rows={4}
                className="app-field w-full resize-y"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setCreateForm(EMPTY_ISSUE_FORM)
                }}
                className="app-secondary-button rounded-full px-4 py-2 text-sm font-medium text-stone-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="app-primary-button rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                {submitting ? 'Adding...' : 'Add issue'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
