// src/components/layouts/navbar.tsx
/**
 * Floating pill-style navigation bar with responsive mobile menu.
 * Implements glassmorphic design with scroll-aware opacity transitions.
 */

'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

import type { NavLink, NavbarProps } from '@/types/navigation'

const NAV_LINKS: NavLink[] = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'About', href: '/about' },
]

export function Navbar({ showCta = true }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = (): void => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  return (
    <>
      <a
        href="#main-content"
        className={cn(
          'sr-only focus:not-sr-only',
          'fixed top-2 left-2 z-[60]',
          'px-4 py-2 rounded-md',
          'bg-primary text-primary-foreground font-medium',
          'focus:outline-none focus:ring-2 focus:ring-ring'
        )}
      >
        Skip to content
      </a>

      <nav
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          'fixed top-5 left-1/2 -translate-x-1/2 z-50',
          'max-w-[1100px] w-[90%]',
          'rounded-full',
          'px-5 md:px-6 lg:px-8 py-3',
          'bg-white/75 dark:bg-white/[0.03]',
          'backdrop-blur-[28px] backdrop-saturate-[1.9]',
          'border border-neutral-200/60 dark:border-white/[0.08]',
          'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_12px_rgba(0,0,0,0.04)]',
          'dark:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_2px_12px_rgba(0,0,0,0.25),inset_0_0_0_0.5px_rgba(255,255,255,0.05)]',
          'flex items-center justify-between',
          'transition-all duration-300 ease-out',
          scrolled && [
            'bg-white/85 dark:bg-white/[0.05]',
            'shadow-[0_12px_40px_rgba(0,0,0,0.1),0_4px_16px_rgba(0,0,0,0.06)]',
            'dark:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.3),inset_0_0_0_0.5px_rgba(255,255,255,0.08)]',
            'border-neutral-200/80 dark:border-white/[0.10]',
          ]
        )}
      >
        <div className="flex items-center -my-12 mr-8">
          <Logo size="md" />
        </div>

        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 h-9">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-4 h-9',
                'inline-flex items-center justify-center',
                'text-[14px] font-medium tracking-[0.01em] leading-none',
                'text-neutral-500 dark:text-white/70',
                'hover:text-neutral-900 dark:hover:text-white',
                'hover:scale-[1.02]',
                'transition-all duration-300 ease-out',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-foreground/50 focus-visible:rounded-md',
                'group',
                pathname === link.href && ['text-neutral-900 dark:text-white']
              )}
            >
              <span className="relative">
                {link.label}
                <span
                  className={cn(
                    'absolute -bottom-1 left-1/2 h-[2px] rounded-full',
                    'bg-neutral-800 dark:bg-white',
                    'transition-all ease-[cubic-bezier(0.16,1,0.3,1)]',
                    pathname === link.href
                      ? 'w-full -translate-x-1/2 opacity-100 duration-500'
                      : 'w-0 -translate-x-1/2 opacity-0 duration-300',
                    'group-hover:w-full group-hover:-translate-x-1/2 group-hover:opacity-100 group-hover:duration-500'
                  )}
                />
              </span>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-2.5 h-9">
          <ThemeToggle />

          {showCta && (
            <Button
              asChild
              size="sm"
              className={cn(
                'hidden sm:inline-flex items-center justify-center',
                'relative overflow-hidden',
                'bg-gradient-to-b from-white/[0.08] via-white/[0.05] to-white/[0.02]',
                'dark:from-white/[0.06] dark:via-white/[0.03] dark:to-white/[0.01]',
                'backdrop-blur-md',
                'border-0',
                'shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]',
                'dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_14px_rgba(255,255,255,0.025)]',
                'text-neutral-700 dark:text-white/90 text-sm font-medium tracking-tight',
                'rounded-full',
                'px-4 py-1.5',
                'transition-all duration-300 ease-out',
                'hover:bg-gradient-to-b hover:from-white/[0.12] hover:via-white/[0.08] hover:to-white/[0.04]',
                'dark:hover:from-white/[0.08] dark:hover:via-white/[0.05] dark:hover:to-white/[0.02]',
                'hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.06)]',
                'dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12),0_0_18px_rgba(255,255,255,0.04)]',
                'hover:text-neutral-900 dark:hover:text-white',
                'hover:scale-[1.01]',
                'hover:[filter:brightness(1.05)_saturate(1.02)]',
                'active:scale-[0.98]'
              )}
            >
              <Link href="/debate/new">Start Debate</Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'md:hidden',
              'p-2 rounded-full',
              'text-neutral-500 hover:text-neutral-900 dark:text-white/70 dark:hover:text-white',
              'hover:bg-neutral-100/80 dark:hover:bg-white/[0.08]',
              'transition-all duration-200 ease-out',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-neutral-500/50'
            )}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <div className="relative w-6 h-6">
              <X
                className={cn(
                  'absolute inset-0 h-6 w-6',
                  'transition-all duration-200 ease-out',
                  mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
                )}
                strokeWidth={2.5}
              />
              <Menu
                className={cn(
                  'absolute inset-0 h-6 w-6',
                  'transition-all duration-200 ease-out',
                  mobileMenuOpen ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
                )}
                strokeWidth={2.5}
              />
            </div>
          </button>
        </div>
      </nav>

      <div
        className={cn(
          'fixed inset-0 z-40',
          'bg-black/30 dark:bg-black/50 backdrop-blur-sm',
          'md:hidden',
          'transition-opacity duration-300 ease-out',
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <div
        className={cn(
          'fixed top-0 right-0 z-50',
          'h-full w-[280px] max-w-[85vw]',
          'bg-white/90 dark:bg-white/[0.04]',
          'backdrop-blur-[20px] backdrop-saturate-[1.8]',
          'border-l border-neutral-200 dark:border-white/[0.10]',
          'shadow-[-8px_0_40px_rgba(0,0,0,0.08)]',
          'dark:shadow-[-8px_0_40px_rgba(0,0,0,0.5),inset_1px_0_0_rgba(255,255,255,0.05)]',
          'md:hidden'
        )}
        style={{
          transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        role="menu"
        aria-label="Mobile navigation menu"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-200 dark:border-white/[0.08]">
          <span className="text-sm font-semibold text-neutral-800 dark:text-white/80">Menu</span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'p-2 -mr-2 rounded-full',
              'text-neutral-500 hover:text-neutral-900 dark:text-white/60 dark:hover:text-white',
              'hover:bg-neutral-100 dark:hover:bg-white/[0.08]',
              'transition-all duration-200 ease-out'
            )}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-4 py-3.5 rounded-xl',
                'text-[15px] font-medium',
                'text-neutral-600 hover:text-neutral-900 dark:text-white/85 dark:hover:text-white',
                'hover:bg-neutral-100 dark:hover:bg-white/[0.08]',
                'transition-all duration-200 ease-out',
                pathname === link.href && [
                  'text-neutral-900 dark:text-white',
                  'bg-neutral-100 dark:bg-white/[0.10]',
                ]
              )}
              role="menuitem"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {showCta && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200 dark:border-white/[0.08]">
            <Link
              href="/debate/new"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block px-4 py-3.5 rounded-xl',
                'text-[15px] font-semibold text-center',
                'bg-neutral-800 text-white dark:bg-white dark:text-neutral-900',
                'hover:bg-neutral-700 dark:hover:bg-white/90',
                'transition-all duration-200 ease-out',
                'shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
              )}
              role="menuitem"
            >
              Start Debate
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
