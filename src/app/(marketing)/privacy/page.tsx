// src/app/(marketing)/privacy/page.tsx
import { PrivacyPageContent } from '@/components/features/privacy-page-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Learn how Debate Lab collects, uses, and protects your personal information and debate data.',
  openGraph: {
    title: 'Privacy Policy | Debate Lab',
    description: 'How we handle your data and protect your privacy.',
  },
}

export default function PrivacyPage() {
  return <PrivacyPageContent />
}
