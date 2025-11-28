// src/components/features/how-it-works-hero.tsx
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'

export function HowItWorksHero() {
  return (
    <Section variant="muted" className="py-12 md:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            How Debate Lab Works
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground md:text-xl">
            From choosing a topic to receiving insights — here is what happens when you start a
            debate between AI models.
          </p>
        </div>
      </Container>
    </Section>
  )
}
