// page.tsx
/**
 * Terms of service page.
 * Delegates content rendering to TermsPageContent component.
 */

import { TermsPageContent } from '@/components/features/terms-page-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms and conditions for using Debate Lab, including acceptable use policies and legal agreements.',
  openGraph: {
    title: 'Terms of Service | Debate Lab',
    description: 'Terms and conditions for using Debate Lab.',
  },
}

export default function TermsPage() {
  return <TermsPageContent />
}
