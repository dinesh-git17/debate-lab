// hero-section.tsx
/**
 * Landing page hero with animated WebGL background.
 * Primary entry point featuring debate creation CTA and scroll navigation.
 */
'use client'

import { ArrowRight, ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import LiquidEther from '@/components/ui/liquid-ether'

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden">
      {/* Liquid Ether WebGL Background */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          autoDemo={true}
          autoSpeed={0.4}
          autoIntensity={1.8}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        />
        {/* Subtle gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/60" />
        {/* Light mode: soft white overlay for text clarity */}
        <div
          className="pointer-events-none absolute inset-0 dark:hidden"
          style={{
            background: `
              linear-gradient(to bottom, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.2) 60%, transparent 80%),
              radial-gradient(ellipse 100% 70% at 50% 35%, rgba(255,255,255,0.5) 0%, transparent 60%)
            `,
          }}
          aria-hidden="true"
        />
        {/* Dark mode: layered backdrop - Apple Sonoma style */}
        <div
          className="pointer-events-none absolute inset-0 hidden dark:block"
          style={{
            background: `
              linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.35) 25%, rgba(0,0,0,0.2) 50%, transparent 75%),
              radial-gradient(ellipse 100% 70% at 50% 35%, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 60%)
            `,
          }}
          aria-hidden="true"
        />
      </div>

      {/* Hero Content */}
      <Container className="relative z-10 pt-24 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-[880px] text-center">
          <h1 className="text-4xl font-bold tracking-wide text-neutral-800 drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl dark:text-foreground">
            <span className="block opacity-0 animate-fade-in-up">Watch AI Models</span>
            <span
              className="mt-1 block bg-gradient-to-r from-neutral-700 via-neutral-600 to-neutral-700 bg-clip-text text-transparent opacity-0 animate-fade-in-up animation-delay-200 cursor-default dark:from-white/90 dark:via-purple-200/80 dark:to-white/90 transition-[letter-spacing] duration-300 hover:tracking-[0.07em]"
              style={{ letterSpacing: '0.035em' }}
            >
              Debate
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-[640px] text-lg leading-7 text-neutral-600 drop-shadow-sm opacity-0 animate-fade-in-up animation-delay-300 dark:text-white/75 md:text-xl">
            Pick any topic. ChatGPT and Grok argue the sides. Claude moderates. You get real
            insights from real AI reasoning.
          </p>

          <div className="mx-auto mt-5 flex max-w-[500px] flex-col items-center justify-center gap-3 opacity-0 animate-fade-in-up animation-delay-500 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-14 rounded-full border border-neutral-300 bg-neutral-800 px-8 text-white shadow-[0_2px_8px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.06)] transition-all duration-500 ease-out hover:-translate-y-[2px] hover:bg-neutral-700 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.08)] active:translate-y-0 active:duration-150 dark:border-white/[0.12] dark:bg-primary dark:text-primary-foreground dark:shadow-[0_2px_12px_rgba(255,255,255,0.07),0_4px_20px_rgba(0,0,0,0.15)] dark:hover:bg-primary/90 dark:hover:shadow-[0_6px_24px_rgba(255,255,255,0.1),0_12px_40px_rgba(0,0,0,0.25)]"
            >
              <Link href="/debate/new">Start a Debate</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="group/cta h-14 rounded-full border-neutral-300 bg-white/60 px-8 text-neutral-700 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-500 ease-out hover:-translate-y-[2px] hover:border-neutral-400 hover:bg-white/80 hover:text-neutral-900 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] active:translate-y-0 active:duration-150 dark:border-white/[0.12] dark:bg-white/[0.02] dark:text-white/95 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] dark:hover:border-white/20 dark:hover:bg-white/[0.06] dark:hover:text-white dark:hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.06)]"
            >
              <Link href="/how-it-works" className="flex items-center gap-2">
                See How It Works
                <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover/cta:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </Container>

      {/* Scroll hint arrow - positioned absolutely at bottom */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 opacity-0 animate-fade-in-up animation-delay-700">
        <a
          href="#how-it-works"
          className="group/scroll flex flex-col items-center gap-1 text-neutral-400 transition-colors duration-300 hover:text-neutral-600 dark:text-white/40 dark:hover:text-white/70"
          aria-label="Scroll to how it works"
        >
          <span className="text-xs font-medium tracking-wide uppercase">Explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce-gentle" />
        </a>
      </div>
    </section>
  )
}
