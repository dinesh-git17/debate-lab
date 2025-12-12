// features-grid.tsx
/**
 * Animated feature showcase grid with intersection-based reveal.
 * Displays platform capabilities in a responsive card layout with glass effects.
 */
'use client'

import { Bot, Eye, Globe, Link2, Scale, Zap } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'

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
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-20 md:py-28 lg:py-36 overflow-hidden"
    >
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />

      {/* Atmospheric background lighting - offset radial gradient */}
      <div
        className={cn(
          'absolute -top-[30%] -right-[20%] w-[140%] h-[140%] dark:block hidden pointer-events-none',
          'transition-opacity duration-1500',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 70% 30%, rgba(130,100,255,0.04) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Secondary ambient glow - left side */}
      <div
        className={cn(
          'absolute top-[40%] -left-[10%] w-[60%] h-[80%] dark:block hidden pointer-events-none',
          'transition-opacity duration-1500 delay-300',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 20% 50%, rgba(100,150,255,0.025) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none opacity-[0.012]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Top section separator - soft gradient fade */}
      <div
        className="absolute top-0 left-0 right-0 h-px dark:block hidden pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, transparent 10%, rgba(255,255,255,0.06) 50%, transparent 90%)',
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-20 dark:block hidden pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 100%)',
        }}
      />

      {/* Light mode separator */}
      <div
        className="absolute top-0 left-0 right-0 h-px dark:hidden pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, transparent 10%, rgba(0,0,0,0.06) 50%, transparent 90%)',
        }}
      />

      {/* Content */}
      <Container className="relative z-10">
        {/* Header with reveal animation */}
        <div
          className={cn(
            'mx-auto max-w-2xl text-center',
            isVisible ? 'animate-apple-reveal-header' : 'opacity-0'
          )}
        >
          <h2 className="text-3xl font-light tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Why{' '}
            <span className="font-semibold bg-gradient-to-r from-foreground via-foreground/90 to-foreground bg-clip-text">
              Debate Lab
            </span>
            ?
          </h2>
          <p className="mt-5 text-base text-muted-foreground/80 md:text-lg leading-relaxed">
            The best way to explore ideas through AI-powered discourse
          </p>
        </div>

        {/* Feature cards grid - 2x3 on desktop, stacked on mobile */}
        <div className="relative mx-auto mt-14 md:mt-16 grid max-w-5xl gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn('group relative', isVisible ? 'animate-apple-reveal' : 'opacity-0')}
              style={{
                animationDelay: isVisible ? `${250 + index * 100}ms` : '0ms',
                animationFillMode: 'backwards',
              }}
            >
              {/* Premium frosted-glass card */}
              <div
                className={cn(
                  'relative rounded-2xl p-6 md:p-7 h-full',
                  // Glass effect
                  'bg-card/50 dark:bg-white/[0.025]',
                  'backdrop-blur-xl',
                  // Border
                  'border border-border/50 dark:border-white/[0.06]',
                  // Subtle inner glow
                  'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]',
                  // Hover effects - subtle lift and brighten
                  'transition-all duration-300 ease-out',
                  'hover:scale-[1.02]',
                  'hover:border-border dark:hover:border-white/[0.1]',
                  'hover:bg-card/80 dark:hover:bg-white/[0.04]',
                  'dark:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_20px_rgba(0,0,0,0.15)]',
                  // Light mode hover
                  'hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]'
                )}
              >
                {/* Icon container - circular with subtle background */}
                <div
                  className={cn(
                    'mb-5 flex h-11 w-11 items-center justify-center rounded-full',
                    // Background
                    'bg-muted/60 dark:bg-white/[0.06]',
                    // Border
                    'border border-border/30 dark:border-white/[0.08]',
                    // Transitions
                    'transition-all duration-300 ease-out',
                    // Hover state - brighten and lift
                    'group-hover:bg-muted dark:group-hover:bg-white/[0.1]',
                    'group-hover:border-border/50 dark:group-hover:border-white/[0.12]',
                    'group-hover:-translate-y-0.5',
                    'group-hover:shadow-md dark:group-hover:shadow-[0_4px_12px_rgba(255,255,255,0.05)]'
                  )}
                >
                  <feature.icon
                    className={cn(
                      'h-5 w-5',
                      // Icon color - cool-toned accent
                      'text-foreground/70 dark:text-white/60',
                      // Hover brightening
                      'transition-all duration-300 ease-out',
                      'group-hover:text-foreground dark:group-hover:text-white/90',
                      'group-hover:scale-105'
                    )}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>

                {/* Title - medium weight */}
                <h3 className="text-base font-medium leading-tight tracking-tight text-foreground md:text-lg">
                  {feature.title}
                </h3>

                {/* Description - muted, slightly smaller */}
                <p className="mt-2.5 text-sm text-muted-foreground/80 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}
