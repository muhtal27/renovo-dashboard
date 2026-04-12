'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="mx-auto max-w-[400px]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50">
          <svg
            width="22"
            height="22"
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

        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">
          Something went wrong
        </h2>

        <p className="mt-2 text-sm leading-7 text-zinc-500">
          This page ran into an error. You can try again or head back to the
          dashboard.
        </p>

        {error.digest && (
          <p className="mt-2 font-mono text-xs text-zinc-400">
            Error ID: {error.digest}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="rounded-md bg-zinc-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="rounded-md border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
