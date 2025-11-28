// src/components/features/open-source-section.tsx
import { ExternalLink, Github } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Prose } from '@/components/ui/prose'

export function OpenSourceSection() {
  return (
    <section id="open-source" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Open Source</h2>
      <Prose className="mt-6">
        <p>
          Debate Lab is open source. We believe in transparency not just in our AI debates, but in
          our code as well. You can view the source code, report issues, or contribute improvements
          on GitHub.
        </p>
        <p>
          The project is built with modern web technologies and follows best practices for
          accessibility, performance, and security. We welcome contributions from the community.
        </p>
      </Prose>
      <div className="mt-6 flex flex-wrap gap-4">
        <Button asChild variant="outline">
          <a
            href="https://github.com/dinesh-git17/llm-debate-arena"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" aria-hidden="true" />
            View on GitHub
          </a>
        </Button>
        <Button asChild variant="ghost">
          <a
            href="https://github.com/dinesh-git17/llm-debate-arena/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
            Report an Issue
          </a>
        </Button>
      </div>
    </section>
  )
}
