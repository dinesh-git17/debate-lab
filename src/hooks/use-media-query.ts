/**
 * SSR-safe media query hook for responsive behavior in client components.
 * Returns boolean indicating if the media query matches.
 */

'use client'

import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    setMatches(mediaQueryList.matches)

    const handleChange = (event: MediaQueryListEvent): void => {
      setMatches(event.matches)
    }

    mediaQueryList.addEventListener('change', handleChange)
    return () => mediaQueryList.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)')
}
