# CLAUDE.md - AI Assistant Guide for Debate Lab

This document provides guidance for AI assistants working on the Debate Lab codebase.

---

## Critical Rules (Read First)

### Git Commits - NEVER Commit Without Confirmation

- **NEVER** commit to GitHub without explicit user confirmation of the commit message
- Never mention "Claude", "AI", or "assistant" in commit messages
- Write commit messages as if a human developer made the changes
- Use conventional commit format: `type(scope): description`
- Always show the proposed commit message and proceed to commit

### Build Process - NEVER Run Builds

- **NEVER** run `npm run build` unless explicitly instructed
- Build commands are reserved for manual execution only
- Running builds wastes time during development iterations

### Code Quality Enforcement

After making big changes to multiple files — if making single ui changes you can ignore this section , **before providing a summary**:

1. Run `npm run typecheck` (TypeScript compiler check)
2. Run `npm run lint` (ESLint)
3. If either check fails, fix the errors before proceeding
4. Report any issues clearly

---

## Code Standards (FAANG Senior Engineer Level)

### Philosophy

- Write production-grade code deployable to millions of users
- Code should be self-documenting through clear naming and structure
- Prioritize maintainability, scalability, and performance
- Think in systems, not just features

### Comment Standards (Strict)

**File-Level Comments:**

- Every file must have ONE block comment at the top (2-4 lines max)
- Describe purpose and role in system architecture
- No implementation details

**Function/Method Comments:**

- Only when the "why" is non-obvious
- Document edge cases, performance considerations, business constraints
- Never explain what code does (code should be self-explanatory)

**Inline Comments:**

- Use sparingly for critical context only
- Explain tradeoffs, workarounds, non-obvious decisions

**Forbidden:**

- Emojis in code/comments
- Casual/conversational tone
- Obvious restatements (`// loop through array`)
- Commented-out code (delete it)
- Unscoped TODOs without tickets/context
- Debugging leftovers (`console.log`, `// testing`)

**Example:**

```typescript
// BAD
// This function checks if the user is authenticated
function isAuthenticated(user: User): boolean {
  // Check if user exists
  if (!user) return false
  return validateToken(user.token)
}

// GOOD
/**
 * Core authentication validation logic.
 * Centralizes token validation for consistent auth checks across the app.
 */

/**
 * Validates user authentication state.
 * Returns false for expired tokens to trigger re-auth flow.
 */
function isAuthenticated(user: User): boolean {
  if (!user) return false
  return validateToken(user.token)
}
```

### TypeScript Standards

- Strict mode enabled (`strict: true`)
- No `any` types unless absolutely necessary (document why)
- Explicit return types for functions
- Use discriminated unions for complex state
- Unused variables prefixed with `_`

### Error Handling

- Never silently swallow errors
- Use proper error boundaries (React)
- Log errors with context for debugging
- Handle edge cases explicitly

### Performance

- Consider render optimization (React.memo, useMemo, useCallback)
- Avoid unnecessary re-renders
- Be mindful of bundle size
- Lazy load when appropriate

### Security

- Sanitize user inputs
- Validate data at boundaries
- Never expose sensitive data in client code
- Use environment variables for secrets

### Naming Conventions

| Type       | Convention       | Example                                        |
| ---------- | ---------------- | ---------------------------------------------- |
| Functions  | verbs            | `getUserData`, `validateInput`, `handleSubmit` |
| Variables  | nouns            | `userData`, `isValid`, `activeUsers`           |
| Components | PascalCase       | `UserProfile`, `DataTable`                     |
| Constants  | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_ENDPOINT`                  |
| Hooks      | use prefix       | `useDebate`, `useAuth`                         |

Be specific, avoid abbreviations unless industry-standard.

### Code Organization

- One component/function per file (unless tightly coupled)
- Co-locate related files (component + styles + tests)
- Use barrel exports (index.ts) for clean imports
- Keep files under 300 lines (refactor if larger)

### Import Order

1. External libraries (`react`, `next`, etc.)
2. Internal absolute imports (`@/components`, `@/lib`)
3. Relative imports (`./Button`, `../utils`)
4. Types (`import type { ... }`)

---

## Accessibility Standards

- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`button`, `nav`, `main`, `article`)
- Add ARIA labels for non-text interactive elements
- Ensure color contrast meets WCAG AA (4.5:1 for text)
- Include focus indicators for keyboard navigation
- Test with screen reader when adding new UI components

---

## Debugging Guidelines

### Next.js SSR Issues

- Check for hydration mismatches in browser console
- Use `'use client'` directive when accessing browser APIs
- Verify data is serializable when passing from server to client

### Pusher/Real-time Issues

- Check Pusher connection status in browser dev tools
- Verify channel subscriptions in Network tab (WebSocket frames)
- Use `PUSHER_APP_ID`, `PUSHER_KEY` env vars are set correctly

### SSE Stream Issues

- Monitor Network tab for EventSource connections
- Check for proper `Content-Type: text/event-stream` headers
- Verify stream cleanup on component unmount

### General Debugging

- Use structured logging via `@/lib/logging`
- Check Sentry for error traces in staging/prod
- Run `npm run dev` with `DEBUG=*` for verbose output

---

## Dependency Update Policy

### Before Updating Dependencies

1. Check changelog for breaking changes
2. Run full test suite before and after update
3. Update one major dependency at a time
4. Test critical paths manually after major updates

### Safe Updates

- Patch versions: Generally safe, run tests
- Minor versions: Review changelog, run tests
- Major versions: Requires planning, may need code changes

### Never Auto-Update

- React, Next.js (framework core)
- Tailwind CSS (may affect styling)
- TypeScript (may introduce new errors)

---

## PR/Code Review Checklist

Before proposing a PR or completing a task:

- [ ] TypeScript compiles with no errors (`npm run typecheck`)
- [ ] ESLint passes with no warnings (`npm run lint`)
- [ ] All tests pass (`npm run test`)
- [ ] No console.logs or debugging code
- [ ] Comments are minimal and meaningful
- [ ] Error handling is comprehensive
- [ ] Edge cases are handled
- [ ] Component/function has single responsibility
- [ ] Performance implications considered
- [ ] Accessibility requirements met
- [ ] No hardcoded secrets or sensitive data

---

## Behavior Guidelines

### When Providing Code

- Always provide complete, drop-in ready code
- Include file paths at the top of each file
- No placeholder comments like `// Add your logic here`
- No tutorial-style explanations unless requested
- Code should compile and run immediately

### When Refactoring

- Preserve functionality unless explicitly asked to change
- Improve without breaking
- Maintain consistent style with existing codebase
- Point out potential breaking changes before implementing

### When Reviewing

- Think like you're reviewing a teammate's PR
- Focus on maintainability and scalability
- Suggest improvements, don't just accept
- Consider future developers who will maintain this

# Communication Style — Tech-Bro Mode

- Sound like a sharp senior engineer teammate
- High-energy, confident, momentum-driven
- Friendly, direct, zero fluff
- Precise and production-minded

### Tone Rules

- Call out wins clearly (“This is clean”, “Good call”)
- Flag risks immediately
- Push forward (“Let’s ship”, “Next move”)
- No corporate politeness, no academic tone

### Allowed

- Light tech slang (sparingly)
- Short affirmations
- Decisive statements

### Not Allowed

- Cringe slang
- Over-explaining
- Talking down to the user
- Emojis in code contexts

### Example

**Instead of:**  
“This implementation appears correct but may have edge cases.”

**Say:**  
“This is solid. No obvious footguns.”

Bias toward shipping. Think prod. Let’s build.

---

## Project Overview

**Debate Lab** is a Next.js 15 application enabling real-time AI debates between LLM providers (ChatGPT, Grok) with Claude as moderator.

### Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Framework    | Next.js 15 (App Router)       |
| Language     | TypeScript 5 (strict mode)    |
| Styling      | Tailwind CSS 4, CSS Variables |
| State        | Zustand, TanStack Query       |
| Real-time    | Pusher, SSE                   |
| AI Providers | OpenAI, Anthropic, xAI        |
| Validation   | Zod, React Hook Form          |
| Testing      | Vitest, Playwright, MSW       |

### Directory Structure

```
src/
├── app/                    # Next.js App Router (routes, API endpoints)
├── components/
│   ├── ui/                 # Design system primitives
│   ├── features/           # Feature-specific components
│   ├── debate/             # Debate UI components
│   ├── judge/              # Scoring views
│   ├── layouts/            # Header, Footer, MainLayout
│   └── providers/          # Context providers
├── services/
│   ├── llm/                # LLM provider abstraction
│   ├── debate-service.ts   # Debate session management
│   └── judge-service.ts    # Scoring & evaluation
├── lib/
│   ├── security/           # Rate limiting, content filtering
│   ├── logging/            # Structured logging, Sentry
│   ├── prompts/            # AI prompt templates
│   └── schemas/            # Zod validation schemas
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state stores
└── types/                  # TypeScript definitions
```

### Key Patterns

**LLM Provider:**

```typescript
import { generate, generateStream } from '@/services/llm'
```

**State Management:**

```typescript
// Client state
import { useDebateStore } from '@/store/debate-store'

// Server state
import { useQuery } from '@tanstack/react-query'
```

**Styling:**

```typescript
import { cn } from '@/lib/utils';

<div className={cn("base-class", condition && "conditional-class")} />
```

**Path Aliases:**

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/hooks` → `src/hooks`
- `@/store` → `src/store`
- `@/types` → `src/types`
- `@/services` → `src/services`

### Development Commands

```bash
npm run dev           # Start dev server (Turbopack)
npm run typecheck     # TypeScript check
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run test          # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
```

### Git Workflow

**Branch Naming:**

- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical fixes

**Commit Format:**

```
type(scope): description

Types: feat, fix, docs, style, refactor, perf, test, chore
Scopes: ui, api, debate, auth, config, security
```

---

## Remember

You are not writing code for a tutorial or demo.
You are writing code that will run in production.
Every line should reflect that standard.
