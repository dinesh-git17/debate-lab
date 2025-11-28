// src/app/(marketing)/how-it-works/page.tsx
import { DebateDetailsAccordion } from '@/components/features/debate-details-accordion'
import { HowItWorksCta } from '@/components/features/how-it-works-cta'
import { HowItWorksHero } from '@/components/features/how-it-works-hero'
import { ProcessTimeline } from '@/components/features/process-timeline'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How It Works',
  description:
    'Learn how Debate Lab works. Choose a topic, watch AI models debate, and get insights from Claude as moderator.',
  openGraph: {
    title: 'How It Works | Debate Lab',
    description: 'Learn how AI models debate topics with neutral moderation.',
  },
}

export default function HowItWorksPage() {
  return (
    <>
      <HowItWorksHero />
      <ProcessTimeline />
      <DebateDetailsAccordion />
      <HowItWorksCta />
    </>
  )
}
