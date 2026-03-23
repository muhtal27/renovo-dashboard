import Image from 'next/image'

type HeroDemoPreviewProps = {
  highlights: Array<{
    value: string
    label: string
  }>
}

export function HeroDemoPreview({ highlights }: HeroDemoPreviewProps) {
  return (
    <div className="relative rounded-[1.95rem] border border-stone-200 bg-white/92 p-4 shadow-[0_24px_54px_rgba(55,43,27,0.12)] backdrop-blur">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          Live workspace preview
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-stone-200 bg-stone-50">
        <div className="border-b border-stone-200 bg-white/95 px-4 py-3">
          <p className="app-kicker">Preview case</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
              Recommendation drafted
            </span>
            <span className="inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
              £640 under review
            </span>
          </div>
        </div>

        <div className="relative aspect-[16/10] w-full bg-stone-100">
          <Image
            src="/renovo-workspace-snapshot.png"
            alt="Renovo workspace preview showing evidence, issues, and recommendation sections"
            fill
            priority
            className="object-cover object-top"
            sizes="(min-width: 1280px) 540px, (min-width: 768px) 44vw, 100vw"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/25 to-transparent" />
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {highlights.map((item) => (
          <div
            key={item.value}
            className="rounded-[1.2rem] border border-stone-200 bg-stone-50/80 px-4 py-3"
          >
            <p className="text-sm font-semibold text-stone-900">{item.value}</p>
            <p className="mt-1 text-xs leading-5 text-stone-600">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
