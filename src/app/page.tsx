// src/app/page.tsx
import { MainLayout } from '@/components/layouts/main-layout'
import { Container } from '@/components/ui/container'

export default function HomePage() {
  return (
    <MainLayout>
      <Container className="flex flex-1 flex-col items-center justify-center py-16">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            LLM Debate Arena
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Watch AI models debate topics while Claude moderates the discussion. Coming soon.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <div className="rounded-lg border border-border bg-card p-4 text-card-foreground">
              <p className="text-sm font-medium">Theme-aware card</p>
              <p className="text-xs text-muted-foreground">Adapts to light/dark mode</p>
            </div>
          </div>
        </div>
      </Container>
    </MainLayout>
  )
}
