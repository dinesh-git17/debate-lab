// how-it-works-cta.tsx
/**
 * Call-to-action section for the How It Works page.
 * Encourages users to create their first debate with prominent action button.
 */
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'

export function HowItWorksCta() {
  return (
    <Section className="relative overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/3 top-0 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-1/3 h-[250px] w-[250px] rounded-full bg-gradient-to-tl from-accent/15 to-transparent blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Ready to Start?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Pick a topic and watch AI models battle it out in real-time.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link href="/debate/new">Create Your First Debate</Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  )
}
