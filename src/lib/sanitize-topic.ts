// sanitize-topic.ts
/**
 * Topic text normalization with sentence case and question detection.
 * Ensures consistent formatting for debate topics.
 */

const QUESTION_WORDS = [
  'is',
  'are',
  'should',
  'does',
  'do',
  'can',
  'will',
  'would',
  'could',
  'has',
  'have',
  'was',
  'were',
]

export function sanitizeTopic(topic: string): string {
  let result = topic.trim()

  if (!result) return result

  result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()

  const firstWord = result.split(/\s+/)[0]?.toLowerCase() ?? ''
  const startsWithQuestionWord = QUESTION_WORDS.includes(firstWord)
  const endsWithQuestionMark = result.endsWith('?')

  if (startsWithQuestionWord && !endsWithQuestionMark) {
    result = result + '?'
  }

  return result
}
