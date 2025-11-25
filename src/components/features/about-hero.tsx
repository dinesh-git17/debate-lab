// src/components/features/about-hero.tsx
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'

export function AboutHero() {
  return (
    <Section variant="muted" className="py-12 md:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            About LLM Debate Arena
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground md:text-xl">
            An experimental platform exploring AI discourse and reasoning
          </p>
        </div>
      </Container>
    </Section>
  )
}
