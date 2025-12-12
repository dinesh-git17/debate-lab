// how-it-works-preview.tsx
/**
 * Landing page process overview with step-by-step cards.
 * Intersection-triggered animations reveal the four-step debate flow.
 */
'use client'

import { Lightbulb, MessageSquare, Scale } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MdInsights } from 'react-icons/md'

import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'

const steps = [
  {
    number: 1,
    icon: Lightbulb,
    title: 'Choose a Topic',
    description: 'Pick any debate topic you are curious about',
  },
  {
    number: 2,
    icon: MessageSquare,
    title: 'AI Models Debate',
    description: 'ChatGPT and Grok argue for and against',
  },
  {
    number: 3,
    icon: Scale,
    title: 'Claude Moderates',
    description: 'Fair, neutral moderation ensures quality',
  },
  {
    number: 4,
    icon: MdInsights,
    title: 'Get Insights',
    description: 'Summary and verdict from the debate',
  },
] as const

export function HowItWorksPreview() {
  const sectionRef = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry?.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
    >
      {/* Base background - uses cool-tinted muted from theme */}
      <div className="absolute inset-0 bg-muted" />

      {/*
        Apple-style atmospheric lighting system:
        - Single unified vertical gradient panel
        - One massive, barely-visible radial for ambient lift
        - Heavy blur, ultra-low opacity (0.008-0.012)
        - No individual circles - just atmospheric tone
      */}

      {/* Unified panel gradient - brightens top, darkens bottom */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(200,210,230,0.008) 0%,
              transparent 35%,
              transparent 65%,
              rgba(0,0,0,0.12) 100%
            )
          `,
        }}
      />

      {/* Single massive atmospheric radial - extremely diffused, offset high */}
      <div
        className={cn(
          'absolute -top-[40%] left-1/2 -translate-x-1/2 w-[200%] h-[120%] dark:block hidden pointer-events-none',
          'transition-opacity duration-1500',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 20%, rgba(180,195,220,0.01) 0%, transparent 100%)',
          filter: 'blur(100px)',
        }}
      />

      {/* Noise texture overlay - prevents banding, adds tactile glass feel */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Top edge fade - soft panel break from hero */}
      <div
        className="absolute top-0 left-0 right-0 h-24 dark:block hidden pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 100%)',
        }}
      />

      {/* Bottom edge fade - seamless transition to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32 dark:block hidden pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.15) 0%, transparent 100%)',
        }}
      />

      {/* Content */}
      <Container className="relative z-10">
        {/* Header with Apple reveal animation */}
        <div
          className={cn(
            'mx-auto max-w-2xl text-center',
            isVisible ? 'animate-apple-reveal-header' : 'opacity-0'
          )}
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From topic to insights in four simple steps
          </p>
        </div>

        {/* Step cards with staggered reveal */}
        <div className="relative mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={cn('group relative', isVisible ? 'animate-apple-reveal' : 'opacity-0')}
              style={{
                animationDelay: isVisible ? `${200 + index * 120}ms` : '0ms',
                animationFillMode: 'backwards',
              }}
            >
              {/* Premium glass card */}
              <div
                className={cn(
                  'relative rounded-xl p-6',
                  'bg-card dark:bg-white/[0.03]',
                  'border border-border dark:border-white/[0.06]',
                  'backdrop-blur-sm',
                  // Premium hover effects
                  'transition-all duration-300 ease-out',
                  'hover:scale-[1.015]',
                  'hover:border-border dark:hover:border-white/[0.12]',
                  'hover:bg-card dark:hover:bg-white/[0.05]',
                  'dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.04)]'
                )}
              >
                {/* Icon with micro-animation */}
                <div
                  className={cn(
                    'mb-4 flex h-10 w-10 items-center justify-center rounded-full',
                    'bg-primary text-primary-foreground',
                    'transition-all duration-300 ease-out',
                    'group-hover:-translate-y-0.5',
                    'group-hover:shadow-lg dark:group-hover:shadow-[0_4px_12px_rgba(255,255,255,0.1)]'
                  )}
                >
                  <step.icon
                    className={cn(
                      'h-5 w-5',
                      'transition-all duration-300 ease-out',
                      'group-hover:scale-105'
                    )}
                    aria-hidden="true"
                  />
                </div>

                {/* Step label */}
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Step {step.number}
                </span>

                {/* Title */}
                <h3 className="mt-2 text-lg font-semibold leading-none tracking-tight text-foreground">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="mt-3 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
