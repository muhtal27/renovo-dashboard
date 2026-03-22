export default function CaseWorkspaceLoading() {
  return (
    <main className="app-grid min-h-screen bg-stone-50 text-stone-900">
      <div className="sticky top-0 z-40 border-b border-stone-200/80 bg-stone-50/90 backdrop-blur">
        <nav className="px-5 py-4 md:px-8">
          <div className="mx-auto flex w-full max-w-[1520px] items-center justify-between gap-4">
            <div className="h-10 w-24 animate-pulse rounded-full bg-stone-200" />
            <div className="h-10 w-32 animate-pulse rounded-full bg-stone-200" />
          </div>
        </nav>
      </div>
      <div className="px-5 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-[1520px] space-y-6">
          <div className="app-surface rounded-[2rem] px-6 py-10 md:px-8">
            <div className="h-4 w-28 animate-pulse rounded-full bg-stone-200" />
            <div className="mt-4 h-10 w-96 animate-pulse rounded-[1rem] bg-stone-200" />
            <div className="mt-4 h-5 w-72 animate-pulse rounded-full bg-stone-200" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[200px,minmax(0,1fr)] xl:grid-cols-[200px,minmax(0,1fr),220px]">
            <div className="app-surface rounded-[1.8rem] p-5">
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-[1rem] bg-stone-200" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="app-surface rounded-[2rem] px-6 py-10 md:px-8">
                  <div className="h-5 w-36 animate-pulse rounded-full bg-stone-200" />
                  <div className="mt-4 h-32 animate-pulse rounded-[1.4rem] bg-stone-200" />
                </div>
              ))}
            </div>
            <div className="space-y-4 lg:col-span-2 xl:col-span-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="app-surface rounded-[1.8rem] p-5">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-stone-200" />
                  <div className="mt-4 h-20 animate-pulse rounded-[1rem] bg-stone-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
