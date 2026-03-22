import type { Metadata } from 'next'
import HomePageClient from '@/app/home-page-client'

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://renovoai.co.uk',
  },
}

export default function HomePage() {
  return <HomePageClient />
}
