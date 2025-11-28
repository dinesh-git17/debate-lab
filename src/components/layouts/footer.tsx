// src/components/layouts/footer.tsx
import { Container } from '@/components/ui/container'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border">
      <Container>
        <div className="flex h-14 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Debate Lab. All rights reserved.
          </p>
        </div>
      </Container>
    </footer>
  )
}
