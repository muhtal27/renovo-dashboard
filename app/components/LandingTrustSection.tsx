type TrustPoint = {
  title: string
  body: string
}

type FaqItem = {
  question: string
  answer: string
}

type LandingTrustSectionProps = {
  points: TrustPoint[]
  faqs: FaqItem[]
}

export function LandingTrustSection({
  points,
  faqs,
}: LandingTrustSectionProps) {
  return (
    <section className="rounded-[2rem] bg-stone-900 p-6 text-white md:p-7">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/90">
            Guidance hub
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Clear reasoning beats black-box automation
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-300">
            Renovo is designed to make end-of-tenancy decisions easier to review, easier to
            explain, and easier to defend later. Trust comes from seeing the evidence, the issue,
            and the reasoning together in one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          {points.map((point) => (
            <article
              key={point.title}
              className="rounded-[1.45rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
            >
              <h3 className="text-base font-semibold text-white">{point.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{point.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[1.45rem] border border-white/10 bg-white/5 px-5 py-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
              Built for deposit-scheme-ready workflows
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-300">
              Designed around real dispute documentation, with evidence, reasoning, and claim
              output kept reviewable before scheme submission.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['MyDeposits', 'TDS', 'DPS', 'More schemes'].map((item) => (
              <span
                key={item}
                className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-slate-300"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Scheme references are shown for workflow context only.
        </p>
      </div>

      <div className="mt-6 border-t border-white/10 pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/90">
          Common questions
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <article
              key={faq.question}
              className="rounded-[1.45rem] border border-white/10 bg-white/6 p-5 backdrop-blur"
            >
              <h3 className="text-base font-semibold text-white">{faq.question}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-300">{faq.answer}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
