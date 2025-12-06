// src/lib/sanitize-topic-basic.ts

/**
 * Level 1: Basic client-side topic cleanup
 * Runs instantly on blur - gives user immediate feedback
 */
export function sanitizeTopicBasic(input: string): string {
  let topic = input.trim()

  if (!topic) return topic

  // 1. Collapse multiple spaces
  topic = topic.replace(/\s+/g, ' ')

  // 2. Sentence case (capitalize first letter, preserve rest)
  topic = topic.charAt(0).toUpperCase() + topic.slice(1)

  // 3. Smart punctuation - add ? if it looks like a question
  const questionStarters =
    /^(is|are|should|does|do|can|will|would|could|has|have|was|were|why|what|how|who)\b/i
  if (questionStarters.test(topic) && !topic.endsWith('?')) {
    topic = topic + '?'
  }

  // 4. Remove trailing periods if it's a question
  if (topic.endsWith('?.')) {
    topic = topic.slice(0, -1)
  }

  return topic
}
