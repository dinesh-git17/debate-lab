// layout.tsx
/**
 * Root layout for fullscreen route group.
 * Renders children without navigation chrome to maximize content area.
 */

interface FullscreenLayoutProps {
  children: React.ReactNode
}

export default function FullscreenLayout({ children }: FullscreenLayoutProps) {
  return <>{children}</>
}
