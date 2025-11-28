// src/components/features/hero-section.tsx
'use client'

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
      </div>

      {/* Hero Content */}
      <Container className="relative z-10 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground drop-shadow-sm sm:text-5xl md:text-6xl lg:text-7xl">
            Watch AI Models
            <span className="block text-muted-foreground">Debate</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground drop-shadow-sm md:text-xl">
            Pick any topic. ChatGPT and Grok argue the sides. Claude moderates. You get real
            insights from real AI reasoning.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/debate/new">Start a Debate</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/how-it-works">See How It Works</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  )
}
