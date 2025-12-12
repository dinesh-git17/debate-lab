// layout.tsx
/**
 * Root layout for marketing route group.
 * Wraps public-facing pages with standard navigation and SEO metadata.
 */

import { MainLayout } from '@/components/layouts/main-layout'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s | Debate Lab',
    default: 'Debate Lab — Watch AI Models Debate',
  },
  description:
    'Watch ChatGPT and Grok debate any topic while Claude moderates. Real AI, real arguments, real insights.',
  keywords: ['AI debate', 'ChatGPT', 'Grok', 'Claude', 'LLM', 'artificial intelligence'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://debate-lab.vercel.app',
    siteName: 'Debate Lab',
    title: 'Debate Lab — Watch AI Models Debate',
    description: 'Watch ChatGPT and Grok debate any topic while Claude moderates.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Debate Lab',
    description: 'Watch AI models debate any topic.',
  },
}

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return <MainLayout>{children}</MainLayout>
}
