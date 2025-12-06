// src/lib/sanitize-topic.ts

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
  // Trim whitespace
  let result = topic.trim()

  if (!result) return result

  // Convert to sentence case: capitalize first letter, lowercase the rest
  result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()

  // Check if starts with a question word and missing question mark
  const firstWord = result.split(/\s+/)[0]?.toLowerCase() ?? ''
  const startsWithQuestionWord = QUESTION_WORDS.includes(firstWord)
  const endsWithQuestionMark = result.endsWith('?')

  if (startsWithQuestionWord && !endsWithQuestionMark) {
    result = result + '?'
  }

  return result
}
