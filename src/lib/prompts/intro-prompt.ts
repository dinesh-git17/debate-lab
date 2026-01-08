// intro-prompt.ts
/**
 * Debate introduction prompt template with Apple keynote-style energy.
 * Generates punchy, modern openings that set the stage for debate.
 */

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, ModeratorContext } from '@/types/prompts'
export const INTRO_PROMPT_TEMPLATE = `Generate a short, punchy debate introduction. This is the first thing users see — make it feel like an event.

## Style
- Apple keynote energy
- TED Talk host clarity
- ESPN commentator confidence
- Modern, clean, minimal
- Slightly provocative — challenge assumptions
- NO academic tone
- NO long explanations
- NO softening or hedging language

## What to Include
1. A bold header: 🎙️ **Today's Debate**
2. The topic in a blockquote (visual centerpiece)
3. ONE friction line that creates tension or discomfort
4. ONE escalation line that signals momentum
5. Clear handoff to FOR

## What NOT to Include
- "Welcome to this debate..."
- Format explanations
- Rule lists
- "As moderator, I will..."
- Turn structure details
- Anything users already know

## Debate Details
- Topic: "{{topic}}"
- First Speaker: FOR

## FORMAT (follow EXACTLY — each section on its own line):

🎙️ **Today's Debate**

> "{{topic}}"

[One friction line — sharp, editorial, 1 sentence]

[One escalation line — short, confident, forward-moving]

---

**FOR, you have the floor.**

## FORMATTING RULES (CRITICAL FOR GEMINI):
1. The header 🎙️ **Today's Debate** must be on its own line
2. The blockquote > "{{topic}}" must be on its own line
3. The friction line must be on its own line (NOT combined with escalation)
4. The escalation line must be on its own line
5. The --- separator must be on its own line
6. The handoff **FOR, you have the floor.** must be on its own line

## Friction Line Examples (pick what fits the topic)
- "Some questions don't have clean answers — just consequences."
- "This sounds simple. It isn't."
- "If this feels obvious, listen closer."
- "Reasonable people disagree. Loudly."

## Escalation Line Examples (pick one)
- "Two sides. Opposing views. And a line that can't be dodged."
- "This isn't theoretical anymore."
- "The arguments are about to collide."

## Word Limit: 60–80 words MAX
Short. Crisp. Scroll-stopping. Get to the action.`

/**
 * Compile introduction prompt with context
 */
export function compileIntroPrompt(context: ModeratorContext): CompiledPrompt {
  const systemPrompt = buildModeratorSystemPrompt(context.format)

  // Simplified template — only needs topic now
  const userPrompt = INTRO_PROMPT_TEMPLATE.replace(/\{\{topic\}\}/g, context.topic)

  return {
    systemPrompt,
    userPrompt,
    maxTokens: 200,
    temperature: 0.7,
  }
}
