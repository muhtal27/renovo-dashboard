/**
 * GET /api/operator/communications — Unified inbox: all messages across cases
 *
 * Query params:
 *   channel  — 'all' | 'manager' | 'landlord' | 'tenant' (default: 'all')
 *   limit    — number (default: 50, max: 200)
 *   offset   — number (default: 0)
 */

import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { getSupabaseServiceRoleClient } from '@/lib/supabase-admin'
import { OPERATOR_PERMISSIONS } from '@/lib/operator-rbac'
import type { EotMessageSenderType } from '@/lib/eot-types'

const VALID_CHANNELS: EotMessageSenderType[] = ['manager', 'landlord', 'tenant']
const MAX_LIMIT = 200
const DEFAULT_LIMIT = 50

export async function GET(request: Request) {
  const authResult = await getOperatorTenantContextForApi(
    OPERATOR_PERMISSIONS.VIEW_CASE
  )

  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.detail }, { status: authResult.status })
  }

  const url = new URL(request.url)
  const channel = url.searchParams.get('channel') ?? 'all'
  const limit = Math.min(
    Number(url.searchParams.get('limit')) || DEFAULT_LIMIT,
    MAX_LIMIT
  )
  const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0)

  const supabase = getSupabaseServiceRoleClient()
  const tenantId = authResult.context.tenantId

  // Build query for messages with case + property context
  let query = supabase
    .from('messages')
    .select(
      `
      id,
      case_id,
      sender_type,
      sender_id,
      content,
      attachments,
      created_at,
      cases!inner (
        status,
        tenancies!inner (
          tenant_name,
          properties!inner (
            address_line_1,
            city,
            postcode
          )
        )
      )
    `,
      { count: 'exact' }
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (channel !== 'all' && VALID_CHANNELS.includes(channel as EotMessageSenderType)) {
    query = query.eq('sender_type', channel)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('Failed to fetch communications', { error, tenantId })
    return NextResponse.json(
      { error: 'Failed to fetch communications.' },
      { status: 500 }
    )
  }

  type MessageRow = {
    id: string
    case_id: string
    sender_type: string
    sender_id: string
    content: string
    attachments: unknown[]
    created_at: string
    cases: {
      status: string
      tenancies: {
        tenant_name: string
        properties: {
          address_line_1: string | null
          city: string | null
          postcode: string | null
        }
      }
    }
  }

  const messages = (data as unknown as MessageRow[] | null)?.map((row) => {
    const property = row.cases?.tenancies?.properties
    const addressParts = [
      property?.address_line_1,
      property?.city,
      property?.postcode,
    ].filter(Boolean)

    return {
      id: row.id,
      case_id: row.case_id,
      sender_type: row.sender_type,
      sender_id: row.sender_id,
      content: row.content,
      attachments: row.attachments ?? [],
      created_at: row.created_at,
      property_address: addressParts.length ? addressParts.join(', ') : null,
      tenant_name: row.cases?.tenancies?.tenant_name ?? null,
      case_status: row.cases?.status ?? null,
    }
  }) ?? []

  return NextResponse.json({
    messages,
    total: count ?? 0,
  })
}
