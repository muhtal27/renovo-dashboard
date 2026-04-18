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
  AI_RECOMMENDATION_OVERRIDDEN: 'ai_recommendation_overridden',
  AI_RECOMMENDATIONS_BULK_ACCEPTED: 'ai_recommendations_bulk_accepted',
  AI_DRAFT_GENERATED: 'ai_draft_generated',
  SUBMISSION_SENT: 'submission_sent',
  CLAIM_SUBMITTED_TO_SCHEME: 'claim_submitted_to_scheme',
  CLAIM_EVIDENCE_UPLOADED_TO_SCHEME: 'claim_evidence_uploaded_to_scheme',
  CASE_STATUS_TRANSITIONED: 'case_status_transitioned',
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
