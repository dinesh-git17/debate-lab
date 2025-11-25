// src/components/features/ai-models-section.tsx
import { Bot, MessageSquare, Scale } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const models = [
  {
    name: 'ChatGPT',
    provider: 'OpenAI',
    role: 'Debater',
    description:
      'One of the most widely-used large language models, known for its broad knowledge and conversational abilities. Randomly assigned to argue FOR or AGAINST.',
    version: 'GPT-4 Turbo',
    icon: MessageSquare,
    isModerator: false,
  },
  {
    name: 'Grok',
    provider: 'xAI',
    role: 'Debater',
    description:
      'Built to be maximally helpful and truthful, with real-time knowledge access. Randomly assigned to argue the opposite side of ChatGPT.',
    version: 'Grok-2',
    icon: Bot,
    isModerator: false,
  },
  {
    name: 'Claude',
    provider: 'Anthropic',
    role: 'Moderator',
    description:
      'Known for nuanced reasoning and safety focus. Serves as the neutral moderator, ensuring fair play and providing final analysis.',
    version: 'Claude 3.5 Sonnet',
    icon: Scale,
    isModerator: true,
  },
] as const

export function AiModelsSection() {
  return (
    <section id="ai-models" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        The AI Models
      </h2>
      <p className="mt-4 text-muted-foreground">
        Three leading AI models, each with a distinct role in every debate
      </p>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {models.map((model) => (
          <Card
            key={model.name}
            className={cn(model.isModerator && 'border-primary/50 bg-primary/5')}
          >
            <Card.Header>
              <div
                className={cn(
                  'mb-2 flex h-10 w-10 items-center justify-center rounded-lg',
                  model.isModerator ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
              >
                <model.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2">
                <Card.Title className="text-lg">{model.name}</Card.Title>
                {model.isModerator && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Moderator
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{model.provider}</p>
            </Card.Header>
            <Card.Content>
              <p className="text-sm text-muted-foreground">{model.description}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                <span className="font-medium">Model:</span> {model.version}
              </p>
            </Card.Content>
          </Card>
        ))}
      </div>
    </section>
  )
}
