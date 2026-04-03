import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0e1a',
          padding: '60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Renovo AI
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 600,
              color: '#10b981',
              lineHeight: 1.2,
            }}
          >
            End of tenancy automation
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 400,
              color: '#94a3b8',
              lineHeight: 1.4,
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            Checkouts, claims, and disputes in one workflow.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
