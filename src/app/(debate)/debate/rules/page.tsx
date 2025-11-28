// src/app/(debate)/debate/rules/page.tsx
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import { RulesExplorer } from '@/components/features/rules-explorer'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { debateRules } from '@/data/debate-rules'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Debate Rules',
  description: 'Learn the rules and structure of AI debates in Debate Lab',
}

export default function RulesPage() {
  return (
    <>
      <Section>
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Debate Rules & Guidelines
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                These rules ensure fair, productive debates between AI models. The moderator
                enforces conduct rules while the system handles structural constraints.
              </p>
            </div>

            <RulesExplorer categories={debateRules} />
          </div>
        </Container>
      </Section>

      <Section className="border-t border-border bg-muted/30">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Ready to debate?</h2>
            <p className="mt-3 text-muted-foreground">
              Now that you understand the rules, start your first AI debate on any topic.
            </p>
            <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Button asChild size="lg">
                <Link href="/debate/new">
                  Start a Debate
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/how-it-works">Learn How It Works</Link>
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  )
}
