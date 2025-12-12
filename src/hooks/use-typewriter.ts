// use-typewriter.ts
/**
 * Typewriter animation for text transitions.
 * Erases old text then types new text with configurable speeds.
 */

import { useState, useCallback, useRef } from 'react'

interface UseTypewriterOptions {
  eraseSpeed?: number
  typeSpeed?: number
  pauseBetween?: number
}

interface UseTypewriterReturn {
  isAnimating: boolean
  displayText: string
  animate: (from: string, to: string) => Promise<void>
  cancel: () => void
}

export function useTypewriter(options: UseTypewriterOptions = {}): UseTypewriterReturn {
  const { eraseSpeed = 20, typeSpeed = 30, pauseBetween = 150 } = options

  const [isAnimating, setIsAnimating] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const abortRef = useRef(false)

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const cancel = useCallback(() => {
    abortRef.current = true
  }, [])

  const animate = useCallback(
    async (from: string, to: string) => {
      setIsAnimating(true)
      abortRef.current = false
      setDisplayText(from)

      for (let i = from.length; i >= 0; i--) {
        if (abortRef.current) break
        setDisplayText(from.slice(0, i))
        await sleep(eraseSpeed)
      }

      if (abortRef.current) {
        setIsAnimating(false)
        return
      }

      await sleep(pauseBetween)

      for (let i = 0; i <= to.length; i++) {
        if (abortRef.current) break
        setDisplayText(to.slice(0, i))
        await sleep(typeSpeed)
      }

      setIsAnimating(false)
    },
    [eraseSpeed, typeSpeed, pauseBetween]
  )

  return { isAnimating, displayText, animate, cancel }
}
