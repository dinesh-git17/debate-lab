// src/components/ui/theme-toggle.tsx
// iOS-style sliding toggle for light/dark mode

'use client'

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useRef, useState } from 'react'
import { IoMoon, IoSunny } from 'react-icons/io5'

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  // Local visual state - decoupled from theme to allow animation
  const [visualState, setVisualState] = useState<'light' | 'dark'>('light')
  const isAnimating = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync visual state with theme on mount and when theme changes externally
  useEffect(() => {
    if (mounted && !isAnimating.current) {
      setVisualState(resolvedTheme === 'dark' ? 'dark' : 'light')
    }
  }, [mounted, resolvedTheme])

  const handleToggle = useCallback(() => {
    if (isAnimating.current) return

    const newState = visualState === 'dark' ? 'light' : 'dark'

    // Start animation
    isAnimating.current = true
    setVisualState(newState)

    // Update theme after spring animation completes
    setTimeout(() => {
      setTheme(newState)
      isAnimating.current = false
    }, 500)
  }, [visualState, setTheme])

  if (!mounted) {
    return (
      <div className="w-[52px] h-[28px] rounded-full bg-black/10 dark:bg-white/10 animate-pulse" />
    )
  }

  const isDark = visualState === 'dark'

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      onClick={handleToggle}
      className="relative w-[52px] h-[28px] rounded-full cursor-pointer p-[2px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-foreground/50"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {/* Track background with subtle glow */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          backgroundColor: isDark ? '#6366f1' : '#facc15',
          boxShadow: isDark
            ? '0 0 12px rgba(99, 102, 241, 0.4), inset 0 1px 2px rgba(0,0,0,0.1)'
            : '0 0 12px rgba(250, 204, 21, 0.35), inset 0 1px 2px rgba(0,0,0,0.05)',
          transition: 'background-color 0.4s ease, box-shadow 0.4s ease',
        }}
      />

      {/* Sliding thumb with reflective highlight */}
      <span
        className="relative block w-6 h-6 rounded-full"
        style={{
          transform: isDark ? 'translateX(24px)' : 'translateX(0px)',
          // Spring animation with overshoot
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
          // Layered shadows: outer shadow + inner glossy highlight
          background: 'linear-gradient(145deg, #ffffff 0%, #f5f5f5 100%)',
          boxShadow: `
            0 2px 8px rgba(0,0,0,0.18),
            0 1px 3px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -1px 2px rgba(0,0,0,0.05)
          `,
        }}
      >
        {/* Icon container */}
        <span className="absolute inset-0 flex items-center justify-center">
          {/* Sun icon */}
          <IoSunny
            className="absolute w-4 h-4 text-amber-500"
            style={{
              opacity: isDark ? 0 : 1,
              transform: isDark ? 'rotate(90deg) scale(0)' : 'rotate(0deg) scale(1)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          />
          {/* Moon icon */}
          <IoMoon
            className="absolute w-4 h-4 text-indigo-500"
            style={{
              opacity: isDark ? 1 : 0,
              transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
              transition: 'opacity 0.3s ease, transform 0.3s ease',
            }}
          />
        </span>
      </span>
    </button>
  )
}
