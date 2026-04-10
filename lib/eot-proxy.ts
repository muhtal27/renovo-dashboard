import { NextResponse } from 'next/server'
import {
  buildEotInternalAuthHeaders,
  getEotApiBaseUrlConfig,
  sanitizeEotSearchParams,
  stripTenantScopeFromPayload,
} from '@/lib/eot-server'
import { getOperatorTenantContextForApi } from '@/lib/operator-server'
import type { OperatorPermission } from '@/lib/operator-rbac'

function buildBackendUrl(requestUrl: string, backendPath: string, baseUrl: string) {
  const incomingUrl = new URL(requestUrl)
  const backendUrl = new URL(backendPath, baseUrl)
  backendUrl.search = sanitizeEotSearchParams(incomingUrl.searchParams).toString()
  return backendUrl
}

function getErrorDetail(text: string, contentType: string) {
  if (!text) {
    return null
  }

  if (contentType.includes('application/json')) {
    try {
      const payload = JSON.parse(text) as unknown

      if (
        payload &&
        typeof payload === 'object' &&
        'detail' in payload &&
        typeof payload.detail === 'string'
      ) {
        return payload.detail
      }
    } catch {
      return null
    }
  }

  return null
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
  requiredPermission?: OperatorPermission,
  options?: { timeoutMs?: number }
) {
  const authResult = await getOperatorTenantContextForApi(requiredPermission)

  if (!authResult.ok) {
    console.warn('EOT proxy operator authorization failed', {
      backendPath,
      method: request.method,
      status: authResult.status,
      detail: authResult.detail,
      requiredPermission,
    })
    return NextResponse.json({ detail: authResult.detail }, { status: authResult.status })
  }

  const backendConfig = getEotApiBaseUrlConfig()
  const backendUrl = buildBackendUrl(request.url, backendPath, backendConfig.value)
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
    console.error('EOT proxy internal auth configuration missing', {
      backendPath,
      method: request.method,
      tenantId: authResult.context.tenantId,
      userId: authResult.context.user.id,
      missingEnv: 'EOT_INTERNAL_AUTH_SECRET',
    })
    return NextResponse.json(
      {
        detail:
          'Missing EOT_INTERNAL_AUTH_SECRET in the Next.js runtime environment. Set it in .env.local and keep it aligned with the backend EOT_INTERNAL_AUTH_SECRET before calling /api/eot/*.',
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
      signal: AbortSignal.timeout(options?.timeoutMs ?? 30_000),
    })
  } catch (error) {
    console.error('EOT proxy backend request failed', {
      backendPath,
      backendUrl: backendUrl.toString(),
      method: request.method,
      backendUrlSource: backendConfig.source,
      error: error instanceof Error ? error.message : 'unknown_error',
    })

    const detail =
      backendConfig.source === 'default_local'
        ? `Unable to reach the EOT backend at ${backendConfig.value}. EOT_API_BASE_URL is not set, so the proxy fell back to the local default. Start the backend on http://127.0.0.1:8000 or set EOT_API_BASE_URL in .env.local.`
        : `Unable to reach the EOT backend at ${backendConfig.value}. Check that the backend is running and that ${backendConfig.source} points at the FastAPI service root.`

    return NextResponse.json(
      {
        detail,
      },
      { status: 502 }
    )
  }

  const text = await response.text()
  const contentType = response.headers.get('content-type') ?? 'application/json'
  const detail = getErrorDetail(text, contentType)

  if (!response.ok) {
    if (response.status === 503 && detail?.includes('EOT internal authentication is not configured')) {
      console.error('EOT backend internal auth configuration missing', {
        backendPath,
        backendUrl: backendUrl.toString(),
        method: request.method,
        backendUrlSource: backendConfig.source,
        missingEnv: 'EOT_INTERNAL_AUTH_SECRET',
      })
    } else if (response.status === 401 && detail === 'Trusted operator context is invalid.') {
      console.error('EOT backend rejected trusted operator context signature', {
        backendPath,
        backendUrl: backendUrl.toString(),
        method: request.method,
        backendUrlSource: backendConfig.source,
        probableCause:
          'Frontend and backend EOT_INTERNAL_AUTH_SECRET values do not match.',
      })
    }

    console.error('EOT proxy backend returned non-2xx response', {
      backendPath,
      backendUrl: backendUrl.toString(),
      method: request.method,
      status: response.status,
      backendUrlSource: backendConfig.source,
      contentType,
      bodyPreview: text.slice(0, 300),
    })
  }

  const cacheControl =
    request.method === 'GET' && response.ok
      ? 'private, max-age=30, stale-while-revalidate=60'
      : 'no-store'

  return new Response(text, {
    status: response.status,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': cacheControl,
    },
  })
}
