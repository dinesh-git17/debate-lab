// layout.tsx
/**
 * Passthrough layout for individual debate views.
 * Inherits fullscreen context from parent route group.
 */

interface DebateViewLayoutProps {
  children: React.ReactNode
}

export default function DebateViewLayout({ children }: DebateViewLayoutProps) {
  return <>{children}</>
}
