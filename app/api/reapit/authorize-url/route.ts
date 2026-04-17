import { proxyEotRequest } from '@/lib/eot-proxy'

/** Get the Reapit Connect authorization URL for the Authorization Code flow. */
export async function GET(request: Request) {
  return proxyEotRequest(request, '/api/integrations/reapit/authorize-url')
}
