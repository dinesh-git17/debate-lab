// src/components/features/tech-stack-section.tsx
import { Box, Cloud, Code2, Database, Palette, Zap } from 'lucide-react'

import { TechBadge } from '@/components/ui/tech-badge'

const technologies = [
  {
    name: 'Next.js 15',
    description: 'React framework for production-grade web applications',
    icon: Box,
    href: 'https://nextjs.org',
  },
  {
    name: 'TypeScript',
    description: 'Type-safe JavaScript for reliable code',
    icon: Code2,
    href: 'https://www.typescriptlang.org',
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first styling for rapid UI development',
    icon: Palette,
    href: 'https://tailwindcss.com',
  },
  {
    name: 'Vercel',
    description: 'Deployment and hosting platform',
    icon: Cloud,
    href: 'https://vercel.com',
  },
  {
    name: 'OpenAI API',
    description: 'Powers the ChatGPT debater',
    icon: Zap,
    href: 'https://platform.openai.com',
  },
  {
    name: 'Anthropic API',
    description: 'Powers Claude, our neutral moderator',
    icon: Database,
    href: 'https://www.anthropic.com',
  },
] as const

export function TechStackSection() {
  return (
    <section id="tech-stack" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Built With</h2>
      <p className="mt-4 text-muted-foreground">
        Modern technologies powering a seamless experience
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {technologies.map((tech) => (
          <TechBadge
            key={tech.name}
            name={tech.name}
            description={tech.description}
            icon={<tech.icon className="h-5 w-5 text-foreground" aria-hidden="true" />}
            href={tech.href}
          />
        ))}
      </div>
    </section>
  )
}
