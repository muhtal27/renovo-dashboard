export default function RootLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    </div>
  )
}
