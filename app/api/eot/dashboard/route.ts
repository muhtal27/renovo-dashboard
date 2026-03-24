import { NextResponse } from 'next/server'
import { ApiError, requireActiveOperator } from '@/app/api/eot/_auth'
import {
  listCaseCommunicationRecords,
  listEndOfTenancyCases,
} from '@/lib/end-of-tenancy/queries'

export async function GET(request: Request) {
  try {
    await requireActiveOperator(request)
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : 250
    const safeLimit = Number.isFinite(limit) ? limit : 250

    const items = await listEndOfTenancyCases({ limit: safeLimit })

    try {
      const communications = await listCaseCommunicationRecords({
        caseIds: items.map((item) => item.case?.id || item.endOfTenancyCase.case_id),
        limit: 400,
      })

      return NextResponse.json({
        ok: true,
        items,
        communications,
        communicationUnavailable: false,
      })
    } catch {
      return NextResponse.json({
        ok: true,
        items,
        communications: [],
        communicationUnavailable: true,
      })
    }
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to load dashboard data right now.',
      },
      { status: error instanceof ApiError ? error.status : 500 }
    )
  }
}
