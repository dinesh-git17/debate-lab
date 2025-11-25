// src/components/features/contact-section.tsx
import { ExternalLink, MessageCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Prose } from '@/components/ui/prose'

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Get in Touch
      </h2>
      <Prose className="mt-6">
        <p>
          We would love to hear from you. Whether you have found a bug, have a feature suggestion,
          or just want to share your experience, there are several ways to reach us.
        </p>
      </Prose>
      <div className="mt-6 flex flex-wrap gap-4">
        <Button asChild variant="outline">
          <a
            href="https://github.com/dinesh-git17/llm-debate-arena/issues/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            Submit Feedback
          </a>
        </Button>
        <Button asChild variant="ghost">
          <a
            href="https://github.com/dinesh-git17/llm-debate-arena/discussions"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Join Discussions
          </a>
        </Button>
      </div>
    </section>
  )
}
