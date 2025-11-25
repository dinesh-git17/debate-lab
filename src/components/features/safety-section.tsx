// src/components/features/safety-section.tsx
import { Prose } from '@/components/ui/prose'

export function SafetySection() {
  return (
    <section id="safety" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Safe &amp; Fair Debates
      </h2>
      <Prose className="mt-6">
        <p>
          Every debate is moderated by Claude, Anthropic&apos;s AI assistant known for its
          thoughtful and safety-conscious approach. The moderator ensures discussions remain
          productive and civil.
        </p>
        <p>
          <strong>What the moderator enforces:</strong>
        </p>
        <ul>
          <li>Arguments must target ideas, not the opposing model</li>
          <li>Responses must stay relevant to the debate topic</li>
          <li>Common logical fallacies are flagged when they occur</li>
          <li>Both sides receive equal opportunity to present their case</li>
        </ul>
        <p>
          <strong>Content policy:</strong>
        </p>
        <ul>
          <li>No hate speech, harassment, or discriminatory content</li>
          <li>No illegal activities or harmful instructions</li>
          <li>No explicit or adult content</li>
          <li>No personal attacks or threats</li>
        </ul>
        <p>
          Topics that violate our content policy will be rejected before the debate begins. Users
          can end any debate at any time if they feel uncomfortable with the direction of the
          discussion.
        </p>
      </Prose>
    </section>
  )
}
