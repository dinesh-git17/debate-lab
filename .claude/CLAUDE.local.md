# .claude/CLAUDE.local.md

# Personal project preferences (git-ignored)

## Git Commit Guidelines

- Never mention "Claude", "AI", or "assistant" in commit messages
- Write commit messages as if a human developer made the changes
- Use conventional commit format: type(scope): description

## Build Process

- NEVER run `npm run build` unless explicitly instructed
- Build commands are reserved for manual execution only
- Running builds wastes time during development iterations

## Code Quality Enforcement

- After ANY file modification, automatically run:
  - `npm run typecheck` (or `tsc --noEmit`)
  - `npm run lint` (or `eslint`)
- Do not proceed if either check fails
- Report errors clearly and wait for fixes before continuing
