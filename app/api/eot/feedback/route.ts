import { NextResponse } from 'next/server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import { getEotInventoryFeedbackSnapshot } from '@/lib/eot-server-data'

export async function GET() {
  const authResult = await getOperatorTenantContextForApi()

  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  try {
    const rows = await getEotInventoryFeedbackSnapshot(authResult.context)
    return NextResponse.json(rows, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load inventory feedback.'
    return NextResponse.json({ detail: message }, { status: 502 })
  }
}
