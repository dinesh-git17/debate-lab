// sanitize-topic-basic.ts
/**
 * Lightweight client-side topic sanitization for immediate user feedback.
 * Handles whitespace, sentence case, and question mark auto-completion.
 */
export function sanitizeTopicBasic(input: string): string {
  let topic = input.trim()

  if (!topic) return topic

  topic = topic.replace(/\s+/g, ' ')

  topic = topic.charAt(0).toUpperCase() + topic.slice(1)

  const questionStarters =
    /^(is|are|should|does|do|can|will|would|could|has|have|was|were|why|what|how|who)\b/i
  if (questionStarters.test(topic) && !topic.endsWith('?')) {
    topic = topic + '?'
  }

  if (topic.endsWith('?.')) {
    topic = topic.slice(0, -1)
  }

  return topic
}
