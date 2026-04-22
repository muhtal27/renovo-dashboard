'use client'

import { useEffect } from 'react'

/**
 * Single client component that wires every cross-page interactive behaviour
 * for .marketing-page. Mounted once by MarketingShell. Each effect selector-
 * scoped and no-ops when its target isn't present on the page.
 *
 * Effects:
 *  - Scroll-pause (body.is-scrolling toggled during active scroll → pauses
 *    every CSS animation/transition under .marketing-page; prevents jank)
 *  - IntersectionObserver reveal for: .reveal, .stagger, .ring-stat, .gauge,
 *    .stack-bar, .bar-trend, .spark, .heat-bars — each gets an `.in` class
 *    that CSS keys off of
 *  - Cursor spotlight (#ambient-spotlight follows the mouse)
 *  - Per-card spotlight (cards set --sx/--sy on mousemove for a radial ::before)
 *  - Count-up on [data-count-to]
 *  - Tag filter delegation: container [data-filter-scope] with .tag-chip[data-tag]
 *    buttons; filters .post-card[data-tags] or .cl-entry[data-cl-tags]
 *  - Code tabs + copy: containers [data-code-card] with .code-tab[data-lang]
 *    and panes [data-lang-pane]; copy button [data-code-copy]
 *  - Dot matrix generator: populates [data-dotmatrix] with 24×5 cells
 *  - Pricing calculator: binds #pricing-calc-blocks range to outputs
 *  - Status heatmap generator: populates [data-status-heatmap] with 90 day
 *    bars varying by tier + hover tooltips
 *  - Window helper: window.__renovoDrawBeam(from, to) for UK map beams
 */
export function MarketingClientEffects() {
  useEffect(() => {
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups: Array<() => void> = []

    // ── Scroll pause ─────────────────────────────────────────────
    {
      let idleTimer: ReturnType<typeof setTimeout> | null = null
      const onScroll = () => {
        if (!document.body.classList.contains('is-scrolling')) {
          document.body.classList.add('is-scrolling')
        }
        if (idleTimer) clearTimeout(idleTimer)
        idleTimer = setTimeout(() => document.body.classList.remove('is-scrolling'), 160)
      }
      window.addEventListener('scroll', onScroll, { passive: true })
      cleanups.push(() => {
        window.removeEventListener('scroll', onScroll)
        if (idleTimer) clearTimeout(idleTimer)
        document.body.classList.remove('is-scrolling')
      })
    }

    // ── Reveal / stagger / chart-in observer ─────────────────────
    {
      const revealSelector =
        '.marketing-page .reveal, .marketing-page .stagger, .marketing-page .ring-stat, .marketing-page .gauge, .marketing-page .stack-bar, .marketing-page .bar-trend, .marketing-page .spark, .marketing-page .heat-bars'

      if (reducedMotion || !('IntersectionObserver' in window)) {
        document.querySelectorAll(revealSelector).forEach((el) => el.classList.add('in'))
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('in')
                io.unobserve(entry.target)
              }
            })
          },
          { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
        )
        const elements = document.querySelectorAll(revealSelector)
        elements.forEach((el) => io.observe(el))
        cleanups.push(() => io.disconnect())
      }
    }

    // ── Cursor spotlight ─────────────────────────────────────────
    if (!reducedMotion) {
      const el = document.getElementById('ambient-spotlight') as HTMLElement | null
      if (el) {
        let rafId: number | null = null
        let tx = 50
        let ty = 50
        const onMove = (e: MouseEvent) => {
          if (document.body.classList.contains('is-scrolling')) return
          tx = (e.clientX / window.innerWidth) * 100
          ty = (e.clientY / window.innerHeight) * 100
          el.classList.add('show')
          if (rafId !== null) return
          rafId = requestAnimationFrame(() => {
            el.style.setProperty('--mx', tx + '%')
            el.style.setProperty('--my', ty + '%')
            rafId = null
          })
        }
        const onLeave = () => el.classList.remove('show')
        window.addEventListener('mousemove', onMove, { passive: true })
        window.addEventListener('mouseleave', onLeave)
        cleanups.push(() => {
          window.removeEventListener('mousemove', onMove)
          window.removeEventListener('mouseleave', onLeave)
          if (rafId !== null) cancelAnimationFrame(rafId)
        })
      }
    }

    // ── Per-card spotlight ───────────────────────────────────────
    if (!reducedMotion) {
      const sel =
        '.marketing-page .outcome-card, .marketing-page .post-card, .marketing-page .proof-card, .marketing-page .content-card, .marketing-page .tier, .marketing-page .preview-card, .marketing-page .stats-tile, .marketing-page .ps-col'
      const handlers = new Map<Element, (e: Event) => void>()
      document.querySelectorAll<HTMLElement>(sel).forEach((card) => {
        const onMove = (evt: Event) => {
          const e = evt as MouseEvent
          const rect = card.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * 100
          const y = ((e.clientY - rect.top) / rect.height) * 100
          card.style.setProperty('--sx', x + '%')
          card.style.setProperty('--sy', y + '%')
        }
        card.addEventListener('mousemove', onMove)
        handlers.set(card, onMove)
      })
      cleanups.push(() => {
        handlers.forEach((h, card) => card.removeEventListener('mousemove', h))
        handlers.clear()
      })
    }

    // ── Count-up ─────────────────────────────────────────────────
    {
      const els = document.querySelectorAll<HTMLElement>('[data-count-to]')
      if (els.length) {
        if (reducedMotion || !('IntersectionObserver' in window)) {
          els.forEach((el) => {
            const n = parseInt(el.dataset.countTo ?? '', 10)
            if (!isNaN(n)) el.textContent = n.toLocaleString('en-GB')
          })
        } else {
          const io = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (!entry.isIntersecting) return
                io.unobserve(entry.target)
                const el = entry.target as HTMLElement
                const target = parseInt(el.dataset.countTo ?? '', 10)
                if (isNaN(target)) return
                const dur = 1600
                const t0 = performance.now()
                const step = (now: number) => {
                  const t = Math.min(1, (now - t0) / dur)
                  const eased = 1 - Math.pow(1 - t, 3)
                  el.textContent = Math.round(target * eased).toLocaleString('en-GB')
                  if (t < 1) requestAnimationFrame(step)
                }
                requestAnimationFrame(step)
              })
            },
            { threshold: 0.3 },
          )
          els.forEach((el) => io.observe(el))
          cleanups.push(() => io.disconnect())
        }
      }
    }

    // ── Tag filters ──────────────────────────────────────────────
    {
      const groups = document.querySelectorAll<HTMLElement>('[data-filter-scope]')
      groups.forEach((group) => {
        const onClick = (e: Event) => {
          const btn = (e.target as HTMLElement).closest<HTMLElement>('.tag-chip')
          if (!btn) return
          const tag = btn.dataset.tag ?? 'all'
          group.querySelectorAll<HTMLElement>('.tag-chip').forEach((c) => c.classList.toggle('active', c === btn))
          const scope = group.dataset.filterScope
          const page = group.closest('.page, section, [data-route]') ?? document.body
          const targets = scope === 'changelog' ? page.querySelectorAll<HTMLElement>('.cl-entry') : page.querySelectorAll<HTMLElement>('.post-card')
          targets.forEach((el) => {
            const elTags = (el.dataset.tags || el.dataset.clTags || '').split(/\s+/).filter(Boolean)
            const show = tag === 'all' || elTags.includes(tag)
            el.classList.toggle('hidden', !show)
            if (el.classList.contains('post-card')) {
              ;(el as HTMLElement).style.display = show ? '' : 'none'
            }
          })
        }
        group.addEventListener('click', onClick)
        cleanups.push(() => group.removeEventListener('click', onClick))
      })
    }

    // ── Code tabs + copy button ──────────────────────────────────
    {
      const cards = document.querySelectorAll<HTMLElement>('[data-code-card]')
      cards.forEach((card) => {
        const tabs = card.querySelectorAll<HTMLButtonElement>('.code-tab')
        const panes = card.querySelectorAll<HTMLElement>('[data-lang-pane]')
        const onTabClick = (e: Event) => {
          const tab = (e.target as HTMLElement).closest<HTMLButtonElement>('.code-tab')
          if (!tab) return
          const lang = tab.dataset.lang
          tabs.forEach((t) => t.classList.toggle('active', t === tab))
          panes.forEach((p) => p.classList.toggle('active', p.dataset.langPane === lang))
        }
        card.addEventListener('click', onTabClick)
        cleanups.push(() => card.removeEventListener('click', onTabClick))

        const copyBtn = card.querySelector<HTMLButtonElement>('[data-code-copy]')
        if (copyBtn) {
          const label = copyBtn.querySelector<HTMLElement>('.code-copy-label')
          const onCopy = async () => {
            const pane = card.querySelector<HTMLElement>('[data-lang-pane].active')
            if (!pane) return
            const text = pane.innerText
            try {
              await navigator.clipboard.writeText(text)
            } catch {
              const ta = document.createElement('textarea')
              ta.value = text
              document.body.appendChild(ta)
              ta.select()
              try {
                document.execCommand('copy')
              } catch {
                /* ignore */
              }
              document.body.removeChild(ta)
            }
            copyBtn.classList.add('copied')
            if (label) label.textContent = 'Copied'
            setTimeout(() => {
              copyBtn.classList.remove('copied')
              if (label) label.textContent = 'Copy'
            }, 1600)
          }
          copyBtn.addEventListener('click', onCopy)
          cleanups.push(() => copyBtn.removeEventListener('click', onCopy))
        }
      })
    }

    // ── Dot matrix (defect heatmap) ──────────────────────────────
    {
      const targets = document.querySelectorAll<HTMLElement>('[data-dotmatrix]')
      targets.forEach((el) => {
        if (el.childElementCount > 0) return
        const cols = 24
        const rows = 5
        const cells: string[] = []
        const weekdayWeights = [0.3, 0.7, 0.9, 1.0, 0.95, 0.75, 0.35]
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const weekdayWeight = weekdayWeights[c % 7]
            const rand = Math.random()
            const score = rand * weekdayWeight
            let lvl = 0
            if (score > 0.85) lvl = 4
            else if (score > 0.6) lvl = 3
            else if (score > 0.35) lvl = 2
            else if (score > 0.15) lvl = 1
            const delay = r * 20 + c * 8
            cells.push(
              `<div class="dot-matrix-cell${lvl ? ' lvl-' + lvl : ''}" style="animation-delay:${delay}ms;" title="Week ${c + 1} row ${r + 1}"></div>`,
            )
          }
        }
        el.innerHTML = cells.join('')
      })
    }

    // ── Pricing calculator ───────────────────────────────────────
    {
      const range = document.getElementById('pricing-calc-blocks') as HTMLInputElement | null
      if (range) {
        const blocksEl = document.getElementById('pricing-calc-blocks-n')
        const tEl = document.getElementById('pricing-calc-tenancies')
        const mEl = document.getElementById('pricing-calc-monthly')
        const pEl = document.getElementById('pricing-calc-per')
        const aEl = document.getElementById('pricing-calc-annual')
        const noteEl = document.getElementById('pricing-calc-note')
        const fmt = (n: number) => '£' + n.toLocaleString('en-GB')
        const update = () => {
          const blocks = parseInt(range.value, 10)
          const tenancies = blocks * 365
          const monthly = blocks * 179
          const perTenancy = monthly / tenancies
          const annual = monthly * 12
          if (blocksEl) blocksEl.textContent = String(blocks)
          if (tEl) tEl.textContent = tenancies.toLocaleString('en-GB')
          if (mEl) mEl.textContent = fmt(monthly)
          if (pEl) pEl.textContent = '£' + perTenancy.toFixed(2)
          if (aEl) aEl.textContent = fmt(annual)
          if (noteEl) {
            noteEl.textContent =
              blocks >= 5
                ? 'Plus VAT. 5+ blocks? Enterprise likely a better fit — custom integrations, SSO, and a named AM. Talk to sales.'
                : 'Plus VAT. Monthly rolling, cancel whenever you like. First month free on new accounts.'
          }
        }
        range.addEventListener('input', update)
        update()
        cleanups.push(() => range.removeEventListener('input', update))
      }
    }

    // ── Status uptime heatmap (90d, synthesised) ─────────────────
    {
      const el = document.querySelector<HTMLElement>('[data-status-heatmap]')
      if (el && el.childElementCount === 0) {
        const days = 90
        const today = new Date()
        const bars: string[] = []
        for (let i = 0; i < days; i++) {
          const date = new Date(today)
          date.setDate(date.getDate() - (days - 1 - i))
          const label = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          let uptime = 99.96 + (Math.random() * 0.04 - 0.02)
          let tier = 'tier-a'
          let status = 'Operational'
          if (i === 82) {
            uptime = 99.52
            tier = 'tier-c'
            status = 'Degraded'
          } else if (i === 70) {
            uptime = 99.48
            tier = 'tier-c'
            status = 'Degraded'
          } else if (i === 51) {
            uptime = 99.79
            tier = 'tier-c'
            status = 'Degraded'
          } else if (uptime >= 99.95) tier = 'tier-a'
          else if (uptime >= 99.88) tier = 'tier-b'
          const heightRatio = Math.max(0.45, Math.min(1, (uptime - 99.3) / 0.7))
          const up = uptime.toFixed(2)
          bars.push(
            `<div class="heat-bar ${tier}" style="--heat-h: ${heightRatio}; transition-delay: ${i * 10}ms;" title="${label} · ${up}% · ${status}"><div class="heat-bar-tooltip">${label} · <b>${up}%</b> · ${status}</div></div>`,
          )
        }
        el.innerHTML = bars.join('')
      }
    }

    // ── UK map beam drawer (exposed globally for home-page-client) ─
    {
      type BeamCity = { x: number; y: number }
      type BeamFn = (a: BeamCity, b: BeamCity) => void
      const beamFn: BeamFn = (a, b) => {
        if (reducedMotion) return
        const layer = document.getElementById('uk-beam-layer')
        if (!layer) return
        const dx = b.x - a.x
        const dy = b.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const angle = Math.atan2(dy, dx) * (180 / Math.PI)
        const beam = document.createElement('div')
        beam.className = 'uk-beam'
        beam.style.left = a.x + '%'
        beam.style.top = a.y + '%'
        beam.style.width = dist + '%'
        beam.style.transform = 'rotate(' + angle + 'deg)'
        layer.appendChild(beam)
        setTimeout(() => beam.remove(), 1700)
      }
      ;(window as unknown as { __renovoDrawBeam?: BeamFn }).__renovoDrawBeam = beamFn
      cleanups.push(() => {
        delete (window as unknown as { __renovoDrawBeam?: BeamFn }).__renovoDrawBeam
      })
    }

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
