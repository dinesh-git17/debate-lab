// page.tsx
/**
 * About page presenting company mission, technology, and policies.
 * Composes multiple informational sections with consistent styling.
 */

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
      <AboutHero />

      <div className="relative overflow-hidden">
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
            <MissionSection />
            <SectionDivider />
            <TechStackSection />
            <SectionDivider />
            <AiModelsSection />
            <PrivacySection />
            <SectionDivider />
            <SafetySection />
            <SectionDivider />
            <DisclaimersSection />
            <SectionDivider />
            <OpenSourceSection />
            <SectionDivider />
            <ContactSection />
          </article>
        </Container>

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
