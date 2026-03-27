import { NextResponse } from 'next/server'
import {
  buildEotInternalAuthHeaders,
  getEotApiBaseUrl,
  sanitizeEotSearchParams,
  stripTenantScopeFromPayload,
} from '@/lib/eot-server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import type { OperatorPermission } from '@/lib/operator-rbac'

function buildBackendUrl(requestUrl: string, backendPath: string) {
  const baseUrl = getEotApiBaseUrl()
  const incomingUrl = new URL(requestUrl)
  const backendUrl = new URL(backendPath, baseUrl)
  backendUrl.search = sanitizeEotSearchParams(incomingUrl.searchParams).toString()
  return backendUrl
}

async function readSanitizedRequestBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return {
      body: undefined,
      contentType: undefined,
    }
  }

  const contentType = request.headers.get('content-type') ?? undefined
  const requestBody = await request.text()

  if (!requestBody) {
    return {
      body: undefined,
      contentType,
    }
  }

  if (!contentType?.includes('application/json')) {
    return {
      body: requestBody,
      contentType,
    }
  }

  try {
    const parsedBody = JSON.parse(requestBody) as unknown
    const sanitizedBody = stripTenantScopeFromPayload(parsedBody)
    return {
      body: JSON.stringify(sanitizedBody),
      contentType,
    }
  } catch {
    return {
      invalidJson: true as const,
      body: undefined,
      contentType,
    }
  }
}

export async function proxyEotRequest(
  request: Request,
  backendPath: string,
  requiredPermission?: OperatorPermission
) {
  const authResult = await getOperatorTenantContextForApi(requiredPermission)

  if (!authResult.ok) {
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  const backendUrl = buildBackendUrl(request.url, backendPath)
  const requestBody = await readSanitizedRequestBody(request)

  if ('invalidJson' in requestBody) {
    return NextResponse.json({ detail: 'Request body must be valid JSON.' }, { status: 400 })
  }

  let trustedHeaders: Record<string, string>

  try {
    trustedHeaders = buildEotInternalAuthHeaders({
      userId: authResult.context.user.id,
      tenantId: authResult.context.tenantId,
      role: authResult.context.role,
      membershipId: authResult.context.membershipId,
      membershipStatus: authResult.context.membershipStatus,
    })
  } catch {
    return NextResponse.json(
      {
        detail: 'EOT internal authentication is not configured.',
      },
      { status: 503 }
    )
  }

  let response: Response

  try {
    response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...trustedHeaders,
        ...(requestBody.body && requestBody.contentType
          ? { 'Content-Type': requestBody.contentType }
          : {}),
      },
      body: requestBody.body,
      cache: 'no-store',
    })
  } catch (error) {
    console.error('EOT proxy backend request failed', {
      backendPath,
      backendUrl: backendUrl.toString(),
      method: request.method,
      error: error instanceof Error ? error.message : 'unknown_error',
    })
    return NextResponse.json(
      {
        detail:
          'Unable to reach the EOT backend. Check EOT_API_BASE_URL or NEXT_PUBLIC_EOT_API_BASE_URL.',
      },
      { status: 502 }
    )
  }

  const text = await response.text()
  const contentType = response.headers.get('content-type') ?? 'application/json'

  if (!response.ok) {
    console.error('EOT proxy backend returned non-2xx response', {
      backendPath,
      backendUrl: backendUrl.toString(),
      method: request.method,
      status: response.status,
      contentType,
      bodyPreview: text.slice(0, 300),
    })
  }

  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': contentType },
  })
}
