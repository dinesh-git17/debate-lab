// src/app/embed/[id]/layout.tsx
/**
 * Minimal layout for embeddable debate widgets.
 * Excludes global navigation and applies embed-specific styles.
 */

import './embed.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  robots: 'noindex, nofollow',
}

export default function EmbedLayout({ children }: { children: React.ReactNode }) {
  return <div className="embed-body">{children}</div>
}
