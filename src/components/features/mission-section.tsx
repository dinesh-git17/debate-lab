// src/components/features/mission-section.tsx
import { Prose } from '@/components/ui/prose'

export function MissionSection() {
  return (
    <section id="mission" className="scroll-mt-20">
      <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Why We Built This
      </h2>
      <Prose className="mt-6">
        <p>
          Debate Lab was born from a simple curiosity: what happens when you pit two of the
          world&apos;s most capable AI models against each other in structured debate?
        </p>
        <p>
          This platform is an experiment in AI discourse. By watching models argue opposing
          positions on topics you care about, you gain insight into how large language models
          reason, persuade, and sometimes stumble. It&apos;s a window into the capabilities and
          limitations of modern AI.
        </p>
        <p>
          Our goal is not to crown a &quot;winner&quot; — it&apos;s to make AI more transparent,
          accessible, and perhaps a little entertaining. Whether you&apos;re a researcher studying
          AI behavior, a student learning about argumentation, or just someone curious about how
          these models think, we hope you find value here.
        </p>
      </Prose>
    </section>
  )
}
