import { NextResponse } from 'next/server'
import { requireActiveOperator } from '@/app/api/end-of-tenancy/_auth'
import { listEndOfTenancyCases } from '@/lib/end-of-tenancy/queries'
import { initializeEndOfTenancyCaseFromExistingCase } from '@/lib/end-of-tenancy/service'

type InitializePayload = {
  action: 'initialize_case'
  caseId: string
  tenancyId?: string | null
  depositClaimId?: string | null
  moveOutDate?: string | null
  inspectionDate?: string | null
}

export async function GET(request: Request) {
  try {
    await requireActiveOperator(request)
    const { searchParams } = new URL(request.url)
    const workflowStatus = searchParams.get('workflowStatus') || undefined
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Number(limitParam) : 100

    const items = await listEndOfTenancyCases({
      limit: Number.isFinite(limit) ? limit : 100,
      workflowStatus: workflowStatus as never,
    })

    return NextResponse.json({ ok: true, items })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Unable to load end-of-tenancy cases right now.',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireActiveOperator(request)
    const payload = (await request.json()) as InitializePayload

    if (payload.action !== 'initialize_case') {
      return NextResponse.json({ error: 'Unsupported end-of-tenancy collection action.' }, { status: 400 })
    }

    const result = await initializeEndOfTenancyCaseFromExistingCase({
      caseId: payload.caseId,
      tenancyId: payload.tenancyId ?? null,
      depositClaimId: payload.depositClaimId ?? null,
      moveOutDate: payload.moveOutDate ?? null,
      inspectionDate: payload.inspectionDate ?? null,
    })

    return NextResponse.json({
      ok: true,
      created: result.created,
      endOfTenancyCase: result.endOfTenancyCase,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to initialise the end-of-tenancy case right now.',
      },
      { status: 500 }
    )
  }
}
