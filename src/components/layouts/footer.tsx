// src/components/layouts/footer.tsx
/**
 * Site-wide footer component with navigation links and CTA.
 * Implements theme-aware layered backgrounds for visual depth.
 */

'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'
import { cn } from '@/lib/utils'

const footerLinks = [
  { label: 'About', href: '/about' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
] as const

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden">
      {/* Light mode background */}
      <div className="absolute inset-0 bg-neutral-50/80 backdrop-blur-sm dark:bg-background dark:backdrop-blur-none" />

      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          background: `
            radial-gradient(
              ellipse 2400px 1200px at 50% 0%,
              rgba(255,255,255,0.6) 0%,
              rgba(250,250,252,0.3) 40%,
              transparent 70%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none dark:hidden"
        style={{
          background: `
            linear-gradient(
              to bottom,
              transparent 0%,
              transparent 85%,
              rgba(0,0,0,0.015) 100%
            )
          `,
        }}
      />

      {/* Dark mode background */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(0,0,0,0.3) 0%,
              rgba(10,12,20,0.95) 100%
            )
          `,
        }}
      />

      {/* Top edge separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent dark:via-transparent dark:from-transparent dark:to-transparent" />

      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none dark:block hidden"
        style={{
          background:
            'linear-gradient(to right, transparent 5%, rgba(255,255,255,0.05) 50%, transparent 95%)',
        }}
      />

      {/* Dark mode ambient lighting layers */}
      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              180deg,
              transparent 0%,
              rgba(140,150,200,0.012) 25%,
              rgba(150,160,210,0.015) 40%,
              rgba(140,150,200,0.01) 55%,
              transparent 75%,
              rgba(0,0,0,0.08) 100%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              135deg,
              transparent 0%,
              transparent 30%,
              rgba(160,170,220,0.008) 50%,
              rgba(150,160,210,0.006) 65%,
              transparent 80%,
              transparent 100%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              225deg,
              transparent 0%,
              transparent 40%,
              rgba(170,180,230,0.006) 55%,
              rgba(160,170,220,0.004) 70%,
              transparent 85%,
              transparent 100%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(
              to bottom,
              rgba(180,190,240,0.006) 0%,
              transparent 15%,
              transparent 85%,
              rgba(0,0,0,0.12) 100%
            )
          `,
        }}
      />

      <div
        className="absolute inset-0 dark:block hidden pointer-events-none"
        style={{
          background: `
            linear-gradient(to right, rgba(0,0,0,0.06) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.06) 100%),
            linear-gradient(to bottom, transparent 0%, transparent 90%, rgba(0,0,0,0.1) 100%)
          `,
        }}
      />

      <div
        className="absolute inset-0 dark:block hidden pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      <Container className="relative z-10">
        <div className="pt-20 pb-12 md:pt-24 md:pb-14">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-neutral-900 dark:text-muted-foreground/60 text-sm font-medium mb-4 leading-relaxed">
              Experience AI-powered discourse
            </p>
            <Button
              asChild
              variant="outline"
              size="lg"
              className={cn(
                'group/cta h-11 md:h-12 rounded-full px-7 md:px-8',
                'border-neutral-300 bg-white/80 text-neutral-700',
                'hover:border-neutral-400 hover:bg-white hover:text-neutral-900',
                'hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
                'dark:border-white/[0.08] dark:bg-transparent dark:text-white/70',
                'dark:hover:border-white/[0.15] dark:hover:bg-white/[0.03] dark:hover:text-white/90',
                'dark:hover:shadow-[0_2px_16px_rgba(255,255,255,0.03)]',
                'transition-all duration-500 ease-out',
                'hover:-translate-y-[1px]',
                'active:translate-y-0 active:duration-150'
              )}
            >
              <Link href="/debate/new" className="flex items-center gap-2">
                Start a Debate
                <span
                  className={cn(
                    'inline-block transition-transform duration-500 ease-out',
                    'group-hover/cta:translate-x-0.5'
                  )}
                >
                  →
                </span>
              </Link>
            </Button>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mb-10">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm leading-relaxed',
                  'text-neutral-600 hover:text-[#0066cc]',
                  'dark:text-muted-foreground/50 dark:hover:text-muted-foreground/80',
                  'transition-all duration-[80ms] ease-out',
                  'hover:-translate-y-[1px]',
                  'relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px',
                  'after:bg-current after:opacity-0 after:transition-opacity after:duration-[80ms]',
                  'hover:after:opacity-[0.04] dark:hover:after:opacity-0'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="text-center">
            <p className="text-xs font-light tracking-wide text-neutral-500 dark:text-muted-foreground/40">
              &copy; {currentYear} Debate Lab. All rights reserved.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  )
}
