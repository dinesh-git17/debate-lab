// src/components/layouts/main-layout.tsx
import { Footer } from '@/components/layouts/footer'
import { Header } from '@/components/layouts/header'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
