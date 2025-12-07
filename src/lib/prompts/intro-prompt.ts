// src/lib/prompts/intro-prompt.ts

import { buildModeratorSystemPrompt } from './moderator-system'

import type { CompiledPrompt, ModeratorContext } from '@/types/prompts'

/**
 * Template for debate introduction — premium, keynote-style
 */
export const INTRO_PROMPT_TEMPLATE = `Generate a short, punchy debate introduction. This is the first thing users see — make it count.

## Style
- Apple keynote energy
- TED Talk host clarity
- ESPN commentator confidence
- Modern, clean, minimal
- NO academic tone
- NO long explanations

## What to Include
1. A bold header: 🎙️ **Today's Debate**
2. The topic in a blockquote (visual centerpiece)
3. One punchy context line (optional)
4. A "versus" energy line
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

## FORMAT (follow exactly):
🎙️ **Today's Debate**

> "{{topic}}"

[One optional context line — punchy, not explanatory]

Two sides. Opposing views. Let's settle this.

---

**FOR, you have the floor.**

## Word Limit: 60-80 words MAX
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
