import { NextResponse } from 'next/server'
import { getEotApiBaseUrl } from '@/lib/eot-server'

function buildBackendUrl(requestUrl: string, backendPath: string) {
  const baseUrl = getEotApiBaseUrl()
  const incomingUrl = new URL(requestUrl)
  const backendUrl = new URL(backendPath, baseUrl)
  backendUrl.search = incomingUrl.search
  return backendUrl
}

export async function proxyEotRequest(request: Request, backendPath: string) {
  const backendUrl = buildBackendUrl(request.url, backendPath)
  const requestBody =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text()

  let response: Response

  try {
    response = await fetch(backendUrl, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(requestBody && request.headers.get('content-type')
          ? { 'Content-Type': request.headers.get('content-type') as string }
          : {}),
      },
      body: requestBody,
      cache: 'no-store',
    })
  } catch {
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

  return new Response(text, {
    status: response.status,
    headers: { 'Content-Type': contentType },
  })
}
