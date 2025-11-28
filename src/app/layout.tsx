// src/app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'

import { Providers } from '@/components/providers'

import type { Metadata, Viewport } from 'next'

import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  // Disable preloading since mono font is only used for code blocks
  // which aren't immediately visible on most pages
  preload: false,
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Debate Lab',
    template: '%s | Debate Lab',
  },
  description: 'Watch AI models debate topics while Claude moderates the discussion',
  keywords: ['AI', 'debate', 'LLM', 'ChatGPT', 'Claude', 'Grok'],
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
