import type { EotMessageSenderType } from '@/lib/eot-types'

/* ────────────────────────────────────────────────────────────── */
/*  Communication Hub tabs                                        */
/* ────────────────────────────────────────────────────────────── */

export const COMMUNICATION_HUB_TABS = [
  'inbox',
  'templates',
  'tenant-portal',
  'landlord-portal',
] as const

export type CommunicationHubTab = (typeof COMMUNICATION_HUB_TABS)[number]

export function isCommunicationHubTab(
  value: string | null | undefined
): value is CommunicationHubTab {
  return Boolean(
    value && COMMUNICATION_HUB_TABS.includes(value as CommunicationHubTab)
  )
}

export function normalizeCommunicationHubTab(
  value: string | null | undefined
): CommunicationHubTab {
  return isCommunicationHubTab(value) ? value : 'inbox'
}

/* ────────────────────────────────────────────────────────────── */
/*  Unified inbox message (enriched with case/property context)   */
/* ────────────────────────────────────────────────────────────── */

export type InboxMessage = {
  id: string
  case_id: string
  sender_type: EotMessageSenderType
  sender_id: string
  content: string
  attachments: Array<Record<string, unknown>>
  created_at: string
  /** Enriched context from the case/tenancy */
  property_address: string | null
  tenant_name: string | null
  case_status: string | null
}

export type InboxFilterChannel = 'all' | EotMessageSenderType
export type InboxFilterStatus = 'all' | 'unread' | 'read'

/* ────────────────────────────────────────────────────────────── */
/*  Message templates                                             */
/* ────────────────────────────────────────────────────────────── */

export type TemplateCategory =
  | 'tenant_notice'
  | 'landlord_update'
  | 'dispute'
  | 'deposit'
  | 'general'

export const TEMPLATE_CATEGORIES: {
  value: TemplateCategory
  label: string
}[] = [
  { value: 'general', label: 'General' },
  { value: 'tenant_notice', label: 'Tenant Notice' },
  { value: 'landlord_update', label: 'Landlord Update' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'deposit', label: 'Deposit' },
]

export type CommunicationTemplate = {
  id: string
  tenant_id: string
  name: string
  subject: string | null
  body: string
  category: TemplateCategory
  variables: string[]
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type CreateTemplateInput = {
  name: string
  subject?: string | null
  body: string
  category: TemplateCategory
  variables?: string[]
}

export type UpdateTemplateInput = Partial<CreateTemplateInput> & {
  is_active?: boolean
}

/* ────────────────────────────────────────────────────────────── */
/*  Template variables available for interpolation                */
/* ────────────────────────────────────────────────────────────── */

export const TEMPLATE_VARIABLES = [
  { key: '{{tenant_name}}', label: 'Tenant Name' },
  { key: '{{landlord_name}}', label: 'Landlord Name' },
  { key: '{{property_address}}', label: 'Property Address' },
  { key: '{{case_reference}}', label: 'Case Reference' },
  { key: '{{deposit_amount}}', label: 'Deposit Amount' },
  { key: '{{checkout_date}}', label: 'Checkout Date' },
  { key: '{{agency_name}}', label: 'Agency Name' },
  { key: '{{today_date}}', label: "Today's Date" },
] as const

/* ────────────────────────────────────────────────────────────── */
/*  Compose / send message                                        */
/* ────────────────────────────────────────────────────────────── */

export type ComposeMessageInput = {
  case_id: string
  recipient_type: 'tenant' | 'landlord'
  subject?: string
  content: string
  template_id?: string
}

/* ────────────────────────────────────────────────────────────── */
/*  Portal conversation (grouped by case for tenant/landlord)     */
/* ────────────────────────────────────────────────────────────── */

export type PortalConversation = {
  case_id: string
  property_address: string | null
  tenant_name: string | null
  landlord_name: string | null
  case_status: string | null
  messages: InboxMessage[]
  last_message_at: string | null
  unread_count: number
}

/* ────────────────────────────────────────────────────────────── */
/*  API response shapes                                           */
/* ────────────────────────────────────────────────────────────── */

export type CommunicationsApiResponse = {
  messages: InboxMessage[]
  total: number
}

export type TemplatesApiResponse = {
  templates: CommunicationTemplate[]
}
