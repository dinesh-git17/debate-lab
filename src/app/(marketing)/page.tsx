// page.tsx
/**
 * Landing page for the marketing site.
 * Composes hero, features, and workflow preview sections.
 */

import { FeaturesGrid } from '@/components/features/features-grid'
import { HeroSection } from '@/components/features/hero-section'
import { HowItWorksPreview } from '@/components/features/how-it-works-preview'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksPreview />
      <FeaturesGrid />
    </>
  )
}
