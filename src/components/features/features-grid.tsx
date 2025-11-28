// src/components/features/features-grid.tsx
import { Bot, Eye, Globe, Link2, Scale, Zap } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'

const features = [
  {
    icon: Bot,
    title: 'Real AI Debates',
    description: 'Not scripted. Real models, real arguments, real reasoning.',
  },
  {
    icon: Scale,
    title: 'Neutral Moderation',
    description: 'Claude ensures fair, balanced discussion every time.',
  },
  {
    icon: Globe,
    title: 'Any Topic',
    description: 'Politics, tech, philosophy, ethics — you choose the subject.',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    description: 'Watch debates unfold in real-time with streaming responses.',
  },
  {
    icon: Link2,
    title: 'Shareable',
    description: 'Generate links to share debates with anyone.',
  },
  {
    icon: Eye,
    title: 'Beautiful UI',
    description: 'Designed for clarity, focus, and readability.',
  },
] as const

export function FeaturesGrid() {
  return (
    <Section id="features">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Why Debate Arena?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The best way to explore ideas through AI-powered discourse
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} hover>
              <Card.Header>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <feature.icon className="h-5 w-5 text-foreground" aria-hidden="true" />
                </div>
                <Card.Title className="text-lg">{feature.title}</Card.Title>
              </Card.Header>
              <Card.Content>
                <Card.Description>{feature.description}</Card.Description>
              </Card.Content>
            </Card>
          ))}
        </div>
      </Container>
    </Section>
  )
}
