// src/app/(fullscreen)/debate/[id]/layout.tsx

interface DebateViewLayoutProps {
  children: React.ReactNode
}

/**
 * Minimal layout for active debate view.
 * Part of (fullscreen) route group - no navbar, no footer.
 */
export default function DebateViewLayout({ children }: DebateViewLayoutProps) {
  return <>{children}</>
}
