// src/components/layouts/navbar.tsx
// Premium pill-style floating navigation bar with FAANG-level polish

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
          'px-6 md:px-8 lg:px-10 py-4',
          'bg-white/65 dark:bg-white/[0.04]',
          'backdrop-blur-[20px] backdrop-saturate-[1.8]',
          'border border-white/[0.12] dark:border-white/[0.10]',
          'shadow-[0_8px_24px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08),inset_0_0_0_0.5px_rgba(255,255,255,0.1)]',
          'dark:shadow-[0_8px_24px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.2),inset_0_0_0_0.5px_rgba(255,255,255,0.05)]',
          'flex items-center justify-between',
          'transition-all duration-300 ease-out',
          scrolled && [
            'bg-white/70 dark:bg-white/[0.06]',
            'shadow-[0_10px_30px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.1),inset_0_0_0_0.5px_rgba(255,255,255,0.15)]',
            'dark:shadow-[0_10px_30px_rgba(0,0,0,0.5),0_4px_10px_rgba(0,0,0,0.25),inset_0_0_0_0.5px_rgba(255,255,255,0.08)]',
            'border-white/[0.2] dark:border-white/[0.12]',
          ]
        )}
      >
        {/* Left: Logo - negative margins allow logo to extend beyond navbar */}
        <div className="flex items-center -my-12 mr-8">
          <Logo size="md" />
        </div>

        {/* Center: Nav Links */}
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 h-10">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'relative px-5 h-10 rounded-full',
                'inline-flex items-center justify-center',
                'text-[15px] font-medium tracking-[0.01em] leading-none',
                'text-black/70 hover:text-black dark:text-white/85 dark:hover:text-white',
                'hover:tracking-[0.025em]',
                'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
                'transition-all duration-300 ease-out',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-foreground/50 focus-visible:rounded-full',
                // Underline animation container
                'group',
                pathname === link.href && [
                  'text-black/90 dark:text-white',
                  'bg-neutral-900/[0.06] dark:bg-white/[0.08]',
                  'shadow-[0_0_12px_rgba(0,0,0,0.06)] dark:shadow-[0_0_12px_rgba(255,255,255,0.08)]',
                ]
              )}
            >
              <span className="relative">
                {link.label}
                {/* Hover underline - slides in from center */}
                <span
                  className="absolute -bottom-0.5 left-0 right-0 h-[1.5px] bg-current underline-animation"
                  data-active={pathname === link.href ? 'true' : 'false'}
                />
                {/* Active dot indicator */}
                {pathname === link.href && (
                  <span
                    className={cn(
                      'absolute -bottom-1.5 left-1/2 -translate-x-1/2',
                      'w-1 h-1 rounded-full',
                      'bg-black dark:bg-white'
                    )}
                  />
                )}
              </span>
            </Link>
          ))}
        </div>

        {/* Right: Theme Toggle + CTA */}
        <div className="flex items-center gap-2.5 md:gap-3 h-10">
          <ThemeToggle />

          {showCta && (
            <Button
              asChild
              size="sm"
              className={cn(
                'hidden sm:inline-flex',
                'relative overflow-hidden',
                'bg-gradient-to-b from-foreground to-foreground/90',
                'text-background font-semibold tracking-[0.01em]',
                'rounded-full',
                'px-5 h-10',
                'shadow-[0_1px_2px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
                'dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]',
                'transition-all duration-200 ease-out',
                // Subtle lift + brightness increase on hover
                'hover:-translate-y-px',
                'hover:brightness-110 dark:hover:brightness-125',
                'hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),0_6px_16px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.15)]',
                'dark:hover:shadow-[0_2px_6px_rgba(0,0,0,0.3),0_6px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
                'active:translate-y-0 active:brightness-100',
                'active:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.1)]',
                // Ripple effect base
                'group/btn',
                'before:absolute before:inset-0 before:rounded-full',
                'before:bg-white/20 before:opacity-0',
                'before:scale-0 before:transition-all before:duration-300',
                'active:before:scale-100 active:before:opacity-100 active:before:duration-0',
                'after:absolute after:inset-0 after:rounded-full',
                'after:bg-white/10 after:opacity-0 after:scale-100',
                'active:after:animate-[ripple-fade_0.4s_ease-out]'
              )}
            >
              <Link href="/debate/new" className="relative z-10">
                Start Debate
              </Link>
            </Button>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              'md:hidden',
              'p-2.5 rounded-full',
              'text-black/70 hover:text-black dark:text-white/70 dark:hover:text-white',
              'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]',
              'hover:shadow-[0_0_12px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_0_12px_rgba(255,255,255,0.1)]',
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

      {/* Mobile Menu Backdrop */}
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

      {/* Mobile Sidebar Menu */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50',
          'h-full w-[280px] max-w-[85vw]',
          // Glassmorphic design matching navbar
          'bg-white/70 dark:bg-white/[0.04]',
          'backdrop-blur-[20px] backdrop-saturate-[1.8]',
          'border-l border-white/[0.15] dark:border-white/[0.10]',
          'shadow-[-8px_0_40px_rgba(0,0,0,0.15),inset_1px_0_0_rgba(255,255,255,0.1)]',
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
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.08] dark:border-white/[0.08]">
          <span className="text-sm font-semibold text-black/80 dark:text-white/80">Menu</span>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              'p-2 -mr-2 rounded-full',
              'text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white',
              'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]',
              'transition-all duration-200 ease-out'
            )}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex flex-col gap-1 p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'px-4 py-3.5 rounded-xl',
                'text-[15px] font-medium',
                'text-black/70 hover:text-black dark:text-white/85 dark:hover:text-white',
                'hover:bg-black/[0.05] dark:hover:bg-white/[0.08]',
                'transition-all duration-200 ease-out',
                pathname === link.href && [
                  'text-black dark:text-white',
                  'bg-black/[0.06] dark:bg-white/[0.10]',
                ]
              )}
              role="menuitem"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* CTA Button at bottom */}
        {showCta && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/[0.08] dark:border-white/[0.08]">
            <Link
              href="/debate/new"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'block px-4 py-3.5 rounded-xl',
                'text-[15px] font-semibold text-center',
                'bg-foreground text-background',
                'hover:bg-foreground/90',
                'transition-all duration-200 ease-out',
                'shadow-[0_2px_8px_rgba(0,0,0,0.1)]'
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
