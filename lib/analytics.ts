import posthog from 'posthog-js'

export const EVENTS = {
  LOGIN_SSO_INITIATED: 'login_sso_initiated',
  LOGIN_COMPLETED: 'login_completed',
  LOGOUT: 'logout',
  CASE_OPENED: 'case_opened',
  WORKSPACE_STEP_CHANGED: 'workspace_step_changed',
  WORKSPACE_STEP_COMPLETED: 'workspace_step_completed',
  EVIDENCE_UPLOADED: 'evidence_uploaded',
  EVIDENCE_DELETED: 'evidence_deleted',
  AI_RECOMMENDATION_ACCEPTED: 'ai_recommendation_accepted',
  AI_RECOMMENDATION_REJECTED: 'ai_recommendation_rejected',
  AI_DRAFT_GENERATED: 'ai_draft_generated',
  SUBMISSION_SENT: 'submission_sent',
  ADJUDICATION_BUNDLE_GENERATED: 'adjudication_bundle_generated',
  CONTACT_FORM_SUBMITTED: 'contact_form_submitted',
  CONTACT_FORM_RECEIVED: 'contact_form_received',
  CHECKOUT_STARTED: 'checkout_started',
  CHECKOUT_SESSION_CREATED: 'checkout_session_created',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
} as const

export type ProductEvent = (typeof EVENTS)[keyof typeof EVENTS]

type BaseProps = Record<string, string | number | boolean | null | undefined>

export function track(event: ProductEvent, properties?: BaseProps) {
  posthog.capture(event, properties)
}
