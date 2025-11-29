// src/app/(marketing)/about/page.tsx
import { AboutHero } from '@/components/features/about-hero'
import { AiModelsSection } from '@/components/features/ai-models-section'
import { ContactSection } from '@/components/features/contact-section'
import { DisclaimersSection } from '@/components/features/disclaimers-section'
import { MissionSection } from '@/components/features/mission-section'
import { OpenSourceSection } from '@/components/features/open-source-section'
import { PrivacySection } from '@/components/features/privacy-section'
import { SafetySection } from '@/components/features/safety-section'
import { TechStackSection } from '@/components/features/tech-stack-section'
import { Container } from '@/components/ui/container'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Learn about Debate Lab — our mission, technology, privacy practices, and the AI models that power debates.',
  openGraph: {
    title: 'About | Debate Lab',
    description: 'Our mission, technology, and commitment to privacy and safety.',
  },
}

// Subtle section divider component
function SectionDivider() {
  return (
    <div
      className="mx-auto h-px w-full max-w-xs"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
      }}
      aria-hidden="true"
    />
  )
}

export default function AboutPage() {
  return (
    <div className="relative">
      {/* Hero section */}
      <AboutHero />

      {/* Main content */}
      <div className="relative overflow-hidden">
        {/* Ambient background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2"
          style={{
            width: '2000px',
            height: '1500px',
            background:
              'radial-gradient(ellipse at center top, rgba(120, 150, 255, 0.012) 0%, transparent 60%)',
          }}
          aria-hidden="true"
        />

        <Container>
          <article className="relative">
            {/* Mission - uses internal 2-col layout */}
            <MissionSection />

            <SectionDivider />

            {/* Tech Stack - uses 3-col grid */}
            <TechStackSection />

            <SectionDivider />

            {/* AI Models - uses 3-col grid, full width needed */}
            <AiModelsSection />

            {/* Privacy - has dark panel, no divider needed (panel acts as separator) */}
            <PrivacySection />

            <SectionDivider />

            {/* Safety - uses 2-col grid */}
            <SafetySection />

            <SectionDivider />

            {/* Disclaimers - narrow centered panel */}
            <DisclaimersSection />

            <SectionDivider />

            {/* Open Source - 2-col cards */}
            <OpenSourceSection />

            <SectionDivider />

            {/* Contact - 2-col layout */}
            <ContactSection />
          </article>
        </Container>

        {/* Bottom fade gradient */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-64"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.2) 0%, transparent 100%)',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
