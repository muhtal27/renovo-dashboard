'use client'

/* eslint-disable @next/next/no-html-link-for-pages */
// Global error boundary renders outside the router — <Link> is unsafe here

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#fef2f2',
              marginBottom: 20,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#09090b',
              margin: 0,
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 1.7,
              color: '#71717a',
            }}
          >
            An unexpected error occurred. This has been logged and
            we&apos;ll look into it. You can try again or go back to the
            dashboard.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: 8,
                fontSize: 12,
                color: '#a1a1aa',
                fontFamily: 'monospace',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#ffffff',
                background: '#18181b',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            <a
              href="/tenancies"
              style={{
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 500,
                color: '#52525b',
                background: 'transparent',
                border: '1px solid #e4e4e7',
                borderRadius: 8,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Go to dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
