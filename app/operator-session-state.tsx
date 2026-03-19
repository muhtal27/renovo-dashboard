import type { CurrentOperator } from '@/lib/operator'

export function OperatorSessionState({
  authLoading,
}: {
  authLoading: boolean
  operator: CurrentOperator | null
}) {
  const message = authLoading ? 'Loading operator session...' : 'Redirecting to sign in...'

  return (
    <main className="app-grid min-h-screen px-5 py-6 text-stone-900 md:px-8 md:py-8">
      <div className="mx-auto max-w-4xl">
        <div className="app-surface rounded-[2rem] px-6 py-10 text-sm text-stone-600">
          {message}
        </div>
      </div>
    </main>
  )
}
