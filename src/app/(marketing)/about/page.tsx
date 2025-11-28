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
import { Divider } from '@/components/ui/divider'
import { Section } from '@/components/ui/section'
import { TableOfContents } from '@/components/ui/table-of-contents'

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

const tocItems = [
  { id: 'mission', label: 'Why We Built This' },
  { id: 'tech-stack', label: 'Built With' },
  { id: 'ai-models', label: 'The AI Models' },
  { id: 'privacy', label: 'Your Privacy' },
  { id: 'safety', label: 'Safe & Fair Debates' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'open-source', label: 'Open Source' },
  { id: 'contact', label: 'Get in Touch' },
]

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <Section>
        <Container>
          <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
            <article className="min-w-0">
              <MissionSection />
              <Divider className="my-12" />
              <TechStackSection />
              <Divider className="my-12" />
              <AiModelsSection />
              <Divider className="my-12" />
              <PrivacySection />
              <Divider className="my-12" />
              <SafetySection />
              <Divider className="my-12" />
              <DisclaimersSection />
              <Divider className="my-12" />
              <OpenSourceSection />
              <Divider className="my-12" />
              <ContactSection />
            </article>
            <aside className="hidden lg:block">
              <TableOfContents items={tocItems} />
            </aside>
          </div>
        </Container>
      </Section>
    </>
  )
}
