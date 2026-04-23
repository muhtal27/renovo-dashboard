'use client'

import { useCallback, useState } from 'react'
import styles from './page.module.css'

const SHARE_URL = 'https://renovoai.co.uk/muhammad'
const SHARE_PAYLOAD = {
  title: 'Muhammad Munawar — Renovo AI',
  text: 'Muhammad Munawar, Founder & CEO at Renovo AI. Software for UK letting agencies.',
  url: SHARE_URL,
}

export default function ContactCard() {
  const [toast, setToast] = useState<string | null>(null)

  const handleShare = useCallback(async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share(SHARE_PAYLOAD)
        return
      } catch {
        // user cancelled or share unavailable — fall through to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && 'clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(SHARE_URL)
        setToast('Link copied')
        setTimeout(() => setToast(null), 2000)
      } catch {
        // ignore
      }
    }
  }, [])

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandLockup}>
            <svg className={styles.brandMark} viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="14" y="24" width="80" height="18" rx="9" fill="#ffffff" />
              <rect x="24" y="55" width="80" height="18" rx="9" fill="#ffffff" />
              <rect x="34" y="86" width="80" height="18" rx="9" fill="#10b981" />
              <rect x="34.5" y="86.5" width="79" height="2" rx="1" fill="#ffffff" opacity="0.35" />
            </svg>
            <span className={styles.brandName}>Renovo AI</span>
          </div>
          <span className={styles.kicker}>
            <span className={styles.pulse} />
            Digital card
          </span>
        </div>

        <div className={styles.hero}>
          <div className={styles.avatar} aria-hidden="true">MM</div>
          <h1 className={styles.name}>Muhammad Munawar</h1>
          <p className={styles.role}>Founder &amp; CEO · Renovo AI</p>
          <p className={styles.tagline}>End of tenancy, resolved.</p>
        </div>

        <a className={styles.primaryBtn} href="/muhammad.vcf" download="muhammad-munawar.vcf">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            <path d="M12 15v6" />
            <path d="M9 18h6" />
          </svg>
          Save to my contacts
        </a>

        <button type="button" className={styles.shareBtn} onClick={handleShare}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share my card
        </button>

        <div className={styles.grid}>
          <a className={styles.linkCard} href="tel:+447901705377">
            <span className={styles.linkLabel}>Mobile</span>
            <span className={styles.linkValue}>+44 (0)7901 705 377</span>
          </a>
          <a className={styles.linkCard} href="mailto:muhammad@renovoai.co.uk">
            <span className={styles.linkLabel}>Email</span>
            <span className={styles.linkValue}>muhammad@renovoai.co.uk</span>
          </a>
          <a className={styles.linkCard} href="https://wa.me/447901705377">
            <span className={styles.linkLabel}>WhatsApp</span>
            <span className={styles.linkValue}>+44 7901 705 377</span>
          </a>
          <a className={styles.linkCard} href="https://www.linkedin.com/in/muhtal/" target="_blank" rel="noopener noreferrer">
            <span className={styles.linkLabel}>LinkedIn</span>
            <span className={styles.linkValue}>in/muhtal</span>
          </a>
          <a className={`${styles.linkCard} ${styles.span2}`} href="https://renovoai.co.uk">
            <span className={styles.linkLabel}>Website</span>
            <span className={styles.linkValue}>renovoai.co.uk · Software for UK letting agencies</span>
          </a>
          <a className={`${styles.linkCard} ${styles.span2}`} href="/demo">
            <span className={styles.linkLabel}>Interactive demo · 10 minutes</span>
            <span className={styles.linkValue}>See how Renovo AI closes out a tenancy →</span>
          </a>
        </div>

        <div className={styles.qrWrap}>
          <img src="/muhammad-qr.png" alt="QR code — renovoai.co.uk/muhammad" width={200} height={200} />
          <span className={styles.qrCaption}>renovoai.co.uk/muhammad</span>
        </div>

        <p className={styles.foot}>
          Renovo AI Ltd · Registered in Scotland SC833544 · 33a Main Street, Gorebridge EH23 4BX · VAT GB483379648
        </p>
      </div>

      <div
        className={`${styles.toast} ${toast ? styles.toastShow : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast ?? 'Link copied'}
      </div>
    </div>
  )
}
