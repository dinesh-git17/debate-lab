// src/app/(debate)/debate/new/page.tsx
import { Container } from '@/components/ui/container'

import { NewDebateForm } from './new-debate-form'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Debate',
  description: 'Configure and start a new AI debate',
}

export default function NewDebatePage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/90 via-white to-neutral-50/50 dark:from-background dark:via-background dark:to-background" />

      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-30 dark:opacity-20 pointer-events-none animate-apple-glow"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-20 md:pb-24">
        <Container>
          <div className="mx-auto max-w-3xl">
            <header className="mb-14 sm:mb-18 md:mb-20 text-center">
              <p className="mb-4 text-sm font-medium text-blue-600 dark:text-blue-400 tracking-wide uppercase animate-hero-reveal">
                Create Debate
              </p>

              <h1 className="text-4xl sm:text-5xl md:text-[3.25rem] font-semibold tracking-tight text-neutral-900 dark:text-white animate-hero-reveal [animation-delay:100ms]">
                Start a New Debate
              </h1>

              <p className="mt-5 sm:mt-6 text-lg sm:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto leading-relaxed animate-hero-reveal [animation-delay:200ms]">
                Configure your topic, format, and rules. Two AI models will argue opposing sides.
              </p>
            </header>

            <div className="animate-card-entrance [animation-delay:300ms]">
              <NewDebateForm />
            </div>
          </div>
        </Container>
      </div>
    </main>
  )
}
