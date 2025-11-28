// src/components/features/privacy-section.tsx
import { Prose } from '@/components/ui/prose'

export function PrivacySection() {
  return (
    <section id="privacy" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Your Privacy
      </h2>
      <Prose className="mt-6">
        <p>
          We believe in minimal data collection. You do not need an account to use Debate Lab — just
          pick a topic and start debating.
        </p>
        <p>
          When you create a debate, your topic and any custom rules are sent to AI providers
          (OpenAI, xAI, Anthropic) to generate responses. These providers have their own privacy
          policies governing how they handle API requests.
        </p>
        <p>
          Debate transcripts are stored temporarily and automatically deleted after 72 hours. Shared
          links expire on the same schedule. We do not maintain long-term records of your debates.
        </p>
        <p>
          <strong>What we do not do:</strong>
        </p>
        <ul>
          <li>We do not sell your data</li>
          <li>We do not use your debates to train AI models</li>
          <li>We do not track you across websites</li>
          <li>We do not require personal information</li>
        </ul>
      </Prose>
    </section>
  )
}
