module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        'no-ai-attribution': ({ raw }) => {
          const blockedPatterns = [
            /co-?authored/i,
            /claude/i,
            /anthropic/i,
            /generated\s+(with|by)/i,
            /\bai\b.*\b(assisted|generated|written)\b/i,
            /\b(assisted|generated|written)\b.*\bai\b/i,
            /chatgpt/i,
            /openai/i,
            /gpt-?[34]/i,
          ]

          for (const pattern of blockedPatterns) {
            if (pattern.test(raw)) {
              return [
                false,
                `Commit message contains blocked AI attribution pattern: ${pattern}. Remove AI-related attribution from commit messages.`,
              ]
            }
          }

          return [true]
        },
      },
    },
  ],
  rules: {
    'no-ai-attribution': [2, 'always'],
  },
}
