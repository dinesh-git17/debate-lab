// src/app/(fullscreen)/layout.tsx
// Minimal layout for fullscreen, distraction-free experiences
// No navbar, no footer - just the content

interface FullscreenLayoutProps {
  children: React.ReactNode
}

export default function FullscreenLayout({ children }: FullscreenLayoutProps) {
  return <>{children}</>
}
