// src/components/layouts/header.tsx
import Link from 'next/link'

import { Container } from '@/components/ui/container'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-lg font-bold">LLM Debate Arena</span>
          </Link>

          <nav className="hidden items-center space-x-6 md:flex">
            <Link
              href="/"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Home
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </Container>
    </header>
  )
}
