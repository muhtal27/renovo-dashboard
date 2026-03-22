'use client'

import { useMemo, useState } from 'react'
import { endOfTenancyApiRequest } from '@/lib/end-of-tenancy/client-api'
import type { EndOfTenancyWorkspacePayload } from '@/lib/end-of-tenancy/types'
import {
  formatDateTime,
  formatLabel,
  formatMoney,
  formatRelativeTime,
  getOutcomeTone,
  getRecommendationTone,
} from '@/app/cases/[id]/workspace-utils'

type RecommendationProps = {
  endOfTenancyCaseId: string
  recommendations: EndOfTenancyWorkspacePayload['recommendations']
  actorNames: Record<string, string>
  latestRecommendationConfidence: number | null
  onRefresh: () => Promise<void>
}

export function Recommendation({
  endOfTenancyCaseId,
  recommendations,
  actorNames,
  latestRecommendationConfidence,
  onRefresh,
}: RecommendationProps) {
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const latestRecommendation = useMemo(
    () =>
      [...recommendations].sort((left, right) =>
        (right.created_at || '').localeCompare(left.created_at || '')
      )[0] ?? null,
    [recommendations]
  )

  async function runReviewAction(action: 'submit' | 'approve' | 'send_back' | 'reject') {
    if (!latestRecommendation) return

    if ((action === 'send_back' || action === 'reject') && !notes.trim()) {
      setError('Notes are required for this review action.')
      return
    }

    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await endOfTenancyApiRequest(`/api/end-of-tenancy/${endOfTenancyCaseId}`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'review_recommendation',
          decisionRecommendationId: latestRecommendation.id,
          reviewAction: action,
          notes: notes.trim() || null,
        }),
      })

      setMessage(
        action === 'submit'
          ? 'Recommendation submitted for review.'
          : action === 'approve'
          ? 'Recommendation approved.'
          : action === 'send_back'
            ? 'Recommendation sent back for revision.'
            : 'Recommendation rejected.'
      )
      setNotes('')
      await onRefresh()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to update the recommendation.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleGenerateRecommendation() {
    setSubmitting(true)
    setError(null)
    setMessage(null)

    try {
      await endOfTenancyApiRequest('/api/eot/recommend', {
        method: 'POST',
        body: JSON.stringify({
          eot_case_id: endOfTenancyCaseId,
        }),
      })

      setMessage('Draft recommendation generated.')
      await onRefresh()
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Unable to generate the recommendation.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="recommendation" className="app-surface rounded-[2rem] px-6 py-6 md:px-8">
      <div>
        <p className="app-kicker">Recommendation</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
          Draft, review, and approval
        </h2>
      </div>

      <div className="app-divider my-6" />

      {!latestRecommendation ? (
        <div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-stone-50/80 px-6 py-10">
          <h3 className="text-lg font-semibold text-stone-900">No recommendation drafted yet</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">
            Once evidence and issues are ready, generate an AI recommendation.
          </p>
          <button
            type="button"
            onClick={() => void handleGenerateRecommendation()}
            disabled={submitting}
            className="app-primary-button mt-6 rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
          >
            {submitting ? 'Generating recommendation...' : 'Generate recommendation'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className={`rounded-[1.8rem] p-5 ${getRecommendationTone(latestRecommendation.recommendation_status)}`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                  Outcome
                </p>
                <p className={`text-2xl font-semibold tracking-tight ${getOutcomeTone(latestRecommendation.recommended_outcome)}`}>
                  {formatLabel(latestRecommendation.recommended_outcome)}
                </p>
                <p className="text-sm opacity-80">
                  {latestRecommendation.decision_summary || 'No decision summary recorded.'}
                </p>
              </div>
              <div className="grid gap-3 text-sm md:text-right">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                    Recommended amount
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatMoney(latestRecommendation.total_recommended_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                    Status
                  </p>
                  <p className="mt-1 font-medium">
                    {formatLabel(latestRecommendation.recommendation_status)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-70">
                    AI confidence
                  </p>
                  <p className="mt-1 font-medium">
                    {latestRecommendationConfidence == null
                      ? 'Not available'
                      : `${Math.round(latestRecommendationConfidence * 100)}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-stone-900">Rationale</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-stone-600">
              {latestRecommendation.rationale || 'No rationale recorded.'}
            </p>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                Sources used
              </p>
              {latestRecommendation.sources.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">No source notes were recorded.</p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {latestRecommendation.sources.map((source) => (
                    <li key={source.id} className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3 text-sm text-stone-600">
                      <span className="font-medium text-stone-900">{formatLabel(source.source_type)}</span>
                      {source.source_note ? ` · ${source.source_note}` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-stone-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-stone-900">Review actions</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-[1fr,auto] md:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-800" htmlFor="review-notes">
                  Review notes
                </label>
                <textarea
                  id="review-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="app-field w-full resize-y"
                  placeholder="Required for send back or reject"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                {latestRecommendation.recommendation_status === 'draft' ? (
                  <button
                    type="button"
                    onClick={() => void runReviewAction('submit')}
                    disabled={submitting}
                    className="app-primary-button rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
                  >
                    Submit recommendation for review
                  </button>
                ) : latestRecommendation.recommendation_status === 'accepted' ? (
                  <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
                    Recommendation approved
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void runReviewAction('approve')}
                      disabled={submitting}
                      className="app-primary-button rounded-full px-5 py-3 text-sm font-medium disabled:opacity-60"
                    >
                      Approve recommendation
                    </button>
                    <button
                      type="button"
                      onClick={() => void runReviewAction('send_back')}
                      disabled={submitting}
                      className="app-secondary-button rounded-full px-5 py-3 text-sm font-medium text-stone-700 disabled:opacity-60"
                    >
                      Send back for revision
                    </button>
                    <button
                      type="button"
                      onClick={() => void runReviewAction('reject')}
                      disabled={submitting}
                      className="rounded-full border border-red-200 px-5 py-3 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

            <div className="app-divider my-6" />

            <div className="space-y-4">
              {latestRecommendation.reviewActions.length === 0 ? (
                <p className="text-sm text-stone-500">No review actions recorded yet.</p>
              ) : (
                latestRecommendation.reviewActions
                  .slice()
                  .sort((left, right) => (right.created_at || '').localeCompare(left.created_at || ''))
                  .map((action) => (
                    <article key={action.id} className="rounded-[1.3rem] border border-stone-200 bg-stone-50/80 px-4 py-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-stone-900">
                            {action.actor_user_id
                              ? actorNames[action.actor_user_id] || 'Unknown operator'
                              : action.actor_type === 'ai'
                                ? 'Renovo AI'
                                : 'System'}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-500">
                            {formatLabel(action.action_type)}
                          </p>
                        </div>
                        <div className="text-right text-xs text-stone-500">
                          <p>{formatRelativeTime(action.created_at)}</p>
                          <p>{formatDateTime(action.created_at)}</p>
                        </div>
                      </div>
                      {action.action_notes ? (
                        <p className="mt-3 text-sm leading-6 text-stone-600">{action.action_notes}</p>
                      ) : null}
                    </article>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
