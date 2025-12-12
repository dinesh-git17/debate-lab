// src/components/ui/logo.tsx
/**
 * Theme-aware logo component with responsive sizing and navigation link.
 * Automatically switches between light and dark logo variants based on current theme.
 */
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

import type { LogoProps } from '@/types/navigation'

const SIZE_CONFIG = {
  sm: { height: 24 },
  md: { height: 110 },
  lg: { height: 32 },
} as const

export function Logo({ size = 'md', className }: Omit<LogoProps, 'showWordmark'>) {
  const config = SIZE_CONFIG[size]
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && resolvedTheme === 'dark' ? '/logo/logo-dark.png' : '/logo/logo.png'

  return (
    <Link
      href="/"
      className={cn(
        'flex items-center cursor-pointer',
        'group',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-foreground/50 focus-visible:rounded-sm',
        className
      )}
      aria-label="Debate Lab - Go to homepage"
    >
      <Image
        src={logoSrc}
        alt="Debate Lab"
        width={1536}
        height={1024}
        className="opacity-90 group-hover:opacity-100 group-hover:-translate-y-[1px] transition-all duration-200"
        style={{ height: `${config.height}px`, width: 'auto' }}
        priority
      />
    </Link>
  )
}
