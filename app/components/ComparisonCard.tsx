type ComparisonCardItem = {
  label: string
  description: string
  meta?: string
}

type ComparisonCardProps = {
  eyebrow: string
  footer: string
  items: ComparisonCardItem[]
  variant: 'good' | 'damage'
}

const VARIANT_STYLES = {
  good: {
    outer:
      'border-emerald-100 bg-[linear-gradient(180deg,rgba(249,250,251,0.95),rgba(240,253,244,0.7))]',
    dot: 'bg-emerald-500',
    item: 'border-emerald-100/80 bg-white/90',
    text: 'text-stone-900',
    meta: 'text-emerald-700',
  },
  damage: {
    outer:
      'border-amber-100 bg-[linear-gradient(180deg,rgba(250,250,249,0.95),rgba(255,251,235,0.75))]',
    dot: 'bg-amber-400',
    item: 'border-amber-100/80 bg-amber-50/55',
    text: 'text-amber-700',
    meta: 'text-stone-400',
  },
} as const

export function ComparisonCard({
  eyebrow,
  footer,
  items,
  variant,
}: ComparisonCardProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <div className={`rounded-[1.6rem] border p-5 ${styles.outer}`}>
      <div className="mb-4 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
          {eyebrow}
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className={`rounded-[1.1rem] border px-4 py-3 ${styles.item}`}>
            <p className="text-xs font-semibold text-stone-500">{item.label}</p>
            <p className={`mt-1 text-sm font-medium ${styles.text}`}>{item.description}</p>
            {item.meta ? <p className={`mt-1 text-[10px] ${styles.meta}`}>{item.meta}</p> : null}
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-stone-400">{footer}</p>
    </div>
  )
}
