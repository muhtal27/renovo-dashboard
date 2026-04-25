import { cookies } from 'next/headers'
import Link from 'next/link'
import { createMarketingMetadata } from '@/lib/marketing-metadata'
import { DEMO_ACCESS_COOKIE, verifyDemoAccessToken } from '@/lib/demo-gate'
import DemoGateForm from './demo-gate-form'

export const metadata = createMarketingMetadata({
  title: 'Interactive demo. Renovo AI',
  description:
    'Click through a short interactive demo of Renovo AI — software for UK letting agencies. Tenancy checkouts, deposit claims and disputes, handled in one place.',
  path: '/demo',
})

// cookies() makes this dynamic — being explicit avoids static-rendering surprises.
export const dynamic = 'force-dynamic'

export default async function DemoPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get(DEMO_ACCESS_COOKIE)?.value
  const payload = verifyDemoAccessToken(token)

  if (payload) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          background: '#0b0b0f',
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontFamily: 'var(--mk-font-sans, system-ui)',
            flexShrink: 0,
          }}
        >
          <span>
            Renovo AI · Interactive demo · <span style={{ color: 'rgba(255,255,255,0.4)' }}>{payload.email}</span>
          </span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              href="/book-demo"
              style={{
                color: '#10b981',
                textDecoration: 'none',
                fontWeight: 500,
              }}
            >
              Book a walkthrough →
            </Link>
            <Link
              href="/"
              style={{
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
              }}
            >
              Exit
            </Link>
          </div>
        </div>
        <iframe
          src="/demo/content"
          title="Renovo AI interactive demo"
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            background: '#fff',
          }}
        />
      </div>
    )
  }

  return (
    <main className="marketing-page">
      <DemoGateForm />
    </main>
  )
}
