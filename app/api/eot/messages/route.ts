import { proxyEotRequest } from '@/lib/eot-proxy'

export async function POST(request: Request) {
  return proxyEotRequest(request, '/api/eot/messages')
}
