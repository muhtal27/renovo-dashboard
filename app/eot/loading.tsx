export default function EotLoading() {
  return (
    <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
      <div className="px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto flex max-w-[1520px] flex-col gap-6">
          <section className="app-surface rounded-[1.9rem] px-6 py-6 md:px-8">
            <div className="h-4 w-28 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-4 h-8 w-72 animate-pulse rounded-[1rem] bg-stone-200" />
            <div className="mt-3 h-5 w-96 animate-pulse rounded-full bg-stone-200" />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="app-surface rounded-[1.7rem] px-5 py-5">
                <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
                <div className="mt-4 h-8 w-16 animate-pulse rounded-[0.6rem] bg-stone-200" />
              </div>
            ))}
          </section>

          <section className="app-surface rounded-[2rem] p-6 md:p-8">
            <div className="h-4 w-28 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-3 h-7 w-48 animate-pulse rounded-[0.8rem] bg-stone-200" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="grid animate-pulse gap-3 rounded-[1.3rem] border border-stone-200 bg-stone-50/80 px-4 py-4 md:grid-cols-[0.95fr,1.5fr,1fr,0.85fr,0.9fr,0.9fr,1fr,0.9fr,0.8fr]"
                >
                  {Array.from({ length: 9 }).map((__, j) => (
                    <div key={j} className="h-5 rounded-full bg-stone-200/80" />
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
