import { NextResponse } from 'next/server'
import { requireActiveOperator } from '@/app/api/end-of-tenancy/_auth'
import { withEndOfTenancyTransaction } from '@/lib/end-of-tenancy/db'
import { getEndOfTenancyCaseDetail } from '@/lib/end-of-tenancy/queries'

function mapIssueTypeToLineItemCategory(issueType: string | null) {
  switch (issueType) {
    case 'cleaning':
    case 'damage':
    case 'missing_item':
    case 'repair':
    case 'redecoration':
    case 'gardening':
    case 'rubbish_removal':
    case 'rent_arrears':
    case 'utilities':
      return issueType
    default:
      return 'other'
  }
}

export async function POST(request: Request) {
  try {
    const operator = await requireActiveOperator(request)
    const payload = (await request.json().catch(() => null)) as { eot_case_id?: unknown } | null

    if (typeof payload?.eot_case_id !== 'string' || payload.eot_case_id.trim() === '') {
      return NextResponse.json({ error: 'eot_case_id is required.' }, { status: 400 })
    }

    const detail = await getEndOfTenancyCaseDetail(payload.eot_case_id)

    if (!detail || !detail.case || !detail.tenancy) {
      return NextResponse.json({ error: 'End-of-tenancy case not found.' }, { status: 404 })
    }

    if (detail.depositClaim) {
      return NextResponse.json({ error: 'A deposit claim already exists for this case.' }, { status: 409 })
    }

    const approvedRecommendation =
      [...detail.recommendations]
        .sort((left, right) => (right.created_at || '').localeCompare(left.created_at || ''))
        .find((item) => item.recommendation_status === 'accepted') ?? null

    if (!approvedRecommendation) {
      return NextResponse.json({ error: 'An approved recommendation is required first.' }, { status: 409 })
    }

    const acceptedIssues = detail.issues.filter(
      (issue) => issue.status === 'accepted' && issue.responsibility !== 'landlord'
    )

    if (acceptedIssues.length === 0) {
      return NextResponse.json({ error: 'No accepted claimable issues were found.' }, { status: 409 })
    }

    const totalClaimAmount = acceptedIssues.reduce((sum, issue) => {
      const amount =
        typeof issue.proposed_amount === 'number'
          ? issue.proposed_amount
          : Number(issue.proposed_amount || 0)
      return sum + (Number.isFinite(amount) ? amount : 0)
    }, 0)

    const propertyId = detail.property?.id ?? detail.case.property_id ?? detail.tenancy.property_id ?? null

    if (!propertyId) {
      return NextResponse.json({ error: 'A property_id is required to generate the claim.' }, { status: 409 })
    }

    const result = await withEndOfTenancyTransaction(async (client) => {
      const claimResult = await client.query<{ id: string }>(
        `
          insert into public.deposit_claims (
            case_id,
            tenancy_id,
            property_id,
            claim_status,
            total_claim_amount,
            evidence_notes
          )
          values ($1, $2, $3, 'draft', $4, $5)
          returning id
        `,
        [
          detail.case?.id ?? null,
          detail.tenancy?.id ?? null,
          propertyId,
          totalClaimAmount,
          approvedRecommendation.decision_summary ?? approvedRecommendation.rationale ?? null,
        ]
      )

      const claimId = claimResult.rows[0]?.id

      for (const issue of acceptedIssues) {
        const amount =
          typeof issue.proposed_amount === 'number'
            ? issue.proposed_amount
            : Number(issue.proposed_amount || 0)

        await client.query(
          `
            insert into public.deposit_claim_line_items (
              deposit_claim_id,
              end_of_tenancy_issue_id,
              decision_recommendation_id,
              line_item_status,
              category,
              description,
              amount_claimed
            )
            values ($1, $2, $3, 'draft', $4, $5, $6)
          `,
          [
            claimId,
            issue.id,
            approvedRecommendation.id,
            mapIssueTypeToLineItemCategory(issue.issue_type),
            issue.title,
            Number.isFinite(amount) ? amount : 0,
          ]
        )
      }

      await client.query(
        `
          update public.end_of_tenancy_cases
          set
            deposit_claim_id = $2,
            workflow_status = 'ready_for_claim',
            updated_at = now()
          where id = $1
        `,
        [detail.endOfTenancyCase.id, claimId]
      )

      await client.query(
        `
          insert into public.decision_review_actions (
            decision_recommendation_id,
            actor_user_id,
            actor_type,
            action_type,
            action_notes
          )
          values ($1, $2, 'user', 'commented', $3)
        `,
        [
          approvedRecommendation.id,
          operator.operatorProfileId,
          'Approved recommendation converted into a draft deposit claim.',
        ]
      )

      return {
        claimId,
      }
    })

    return NextResponse.json({
      success: true,
      claim_id: result.claimId,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Unable to generate the claim.',
      },
      { status: 500 }
    )
  }
}
