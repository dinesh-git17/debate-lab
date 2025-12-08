# CLAUDE.md - AI Assistant Guide for Debate Lab

This document provides comprehensive guidance for AI assistants working on the Debate Lab codebase.

## Project Overview

**Debate Lab** is a Next.js 15 application that enables real-time AI debates between different LLM providers (ChatGPT, Grok) with Claude as moderator. Users can:
- Configure debate topics and rules
- Watch AI models debate in real-time with streaming responses
- Get comprehensive judging with scoring, clash analysis, and educational insights
- Share and export debate transcripts

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 (App Router) | Full-stack React framework |
| Language | TypeScript 5 (strict mode) | Type safety |
| Styling | Tailwind CSS 4, CSS Variables | Design system with dark/light themes |
| State | Zustand, TanStack Query | Client state + server cache |
| Real-time | Pusher, SSE | Live streaming updates |
| AI Providers | OpenAI, Anthropic, xAI | Multi-model orchestration |
| Validation | Zod, React Hook Form | Schema-first form handling |
| Testing | Vitest, Playwright, MSW | Unit, integration & E2E tests |
| Monitoring | Sentry, Web Vitals | Error tracking & performance |
| Database | Supabase (optional) | Persistence & abuse tracking |
| Cache | Upstash Redis (optional) | Rate limiting, session storage |

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (debate)/           # Debate creation routes
│   ├── (fullscreen)/       # Immersive debate experience
│   ├── (marketing)/        # Landing & info pages
│   └── api/                # REST API endpoints
│
├── components/
│   ├── ui/                 # Design system primitives (Button, Input, Card, etc.)
│   ├── features/           # Feature-specific components (forms, hero sections)
│   ├── debate/             # Debate UI (message bubbles, controls, typing indicators)
│   ├── judge/              # Scoring & analysis views
│   ├── summary/            # Post-debate summaries
│   ├── layouts/            # Header, Footer, Navbar, MainLayout
│   ├── providers/          # Context providers (theme, query, performance)
│   └── performance/        # Optimized components (lazy loading, virtual lists)
│
├── services/
│   ├── llm/                # LLM provider abstraction layer
│   │   ├── llm-service.ts  # Main entry point for LLM calls
│   │   ├── base-provider.ts    # Abstract base class
│   │   ├── provider-factory.ts # Provider instantiation
│   │   ├── openai-provider.ts  # OpenAI/ChatGPT implementation
│   │   ├── anthropic-provider.ts # Claude implementation
│   │   └── xai-provider.ts     # Grok implementation
│   ├── debate-service.ts   # Debate session management
│   ├── judge-service.ts    # Scoring & evaluation
│   ├── turn-sequencer.ts   # Turn management
│   ├── budget-manager.ts   # Token budget tracking
│   └── rule-validation-service.ts # Custom rule validation
│
├── lib/
│   ├── security/           # Rate limiting, content filtering, abuse tracking
│   ├── logging/            # Structured logging, metrics, Sentry integration
│   ├── prompts/            # AI prompt templates (moderator, debater, judge)
│   ├── performance/        # Optimization utilities, caching configs
│   ├── schemas/            # Zod validation schemas
│   ├── supabase/           # Database client
│   ├── pusher.ts           # Server-side Pusher client
│   ├── pusher-client.ts    # Client-side Pusher
│   ├── session-store.ts    # Debate session storage
│   ├── token-counter.ts    # Token counting utilities
│   └── utils.ts            # General utilities (cn for classnames)
│
├── hooks/                  # Custom React hooks
│   ├── use-debate.ts       # Main debate hook
│   ├── use-debate-stream.ts    # Streaming handler
│   ├── use-debate-realtime.ts  # Pusher subscription
│   ├── use-create-debate.ts    # Debate creation mutation
│   └── use-keyboard-shortcuts.ts # Keyboard navigation
│
├── store/                  # Zustand state stores
│   ├── debate-store.ts     # Active debate state
│   ├── judge-store.ts      # Judge/scoring state
│   ├── summary-store.ts    # Post-debate summary
│   ├── ui-store.ts         # UI preferences
│   └── debate-view-store.ts # View configuration
│
└── types/                  # TypeScript definitions
    ├── index.ts            # Main exports and core types
    ├── debate.ts           # Debate-specific types
    ├── llm.ts              # LLM provider types
    ├── judge.ts            # Scoring types
    ├── security.ts         # Security types
    └── ...                 # Additional type modules
```

## Key API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debate` | POST | Create new debate session |
| `/api/debate/[id]` | GET | Get debate session |
| `/api/debate/[id]/stream` | GET | SSE stream for debate |
| `/api/debate/[id]/engine` | POST | Start debate engine |
| `/api/debate/[id]/engine/control` | POST | Pause/resume/cancel debate |
| `/api/debate/[id]/judge` | GET | Get judge scoring |
| `/api/debate/[id]/summary` | GET | Get debate summary |
| `/api/debate/[id]/share` | POST | Generate shareable link |
| `/api/debate/[id]/reveal` | GET | Reveal which AI took which side |
| `/api/debate/[id]/budget` | GET | Get token budget status |
| `/api/health` | GET | Health check |
| `/api/admin/bans` | GET/POST | Ban management (requires API key) |
| `/api/metrics` | GET | Application metrics |

## Development Commands

```bash
# Development
npm run dev           # Start with Turbopack (fast)
npm run dev:webpack   # Start with Webpack

# Quality checks
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run typecheck     # TypeScript compiler check
npm run format        # Prettier format all files
npm run format:check  # Check formatting

# Testing
npm run test          # Run Vitest unit tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Playwright UI mode
npm run test:e2e:headed # Run E2E with browser visible

# Build
npm run build         # Production build
npm run start         # Start production server
```

## Code Conventions

### TypeScript

- **Strict mode enabled** with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Use explicit return types for functions
- Use interfaces for objects, type aliases for unions/intersections
- Avoid `any` - use `unknown` when type is truly unknown
- Unused variables must be prefixed with `_`

```typescript
// Good
function calculateScore(turns: Turn[]): number {
  return turns.reduce((sum, turn) => sum + turn.score, 0);
}

// Good - unused parameter
function handler(_event: Event, data: Data): void { ... }
```

### React

- **Functional components only** with typed props
- Use `'use client'` directive only when necessary
- Prefer Server Components by default (Next.js App Router)
- Custom hooks start with `use` prefix

```tsx
interface ButtonProps {
  variant: 'primary' | 'secondary';
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant, children, onClick }: ButtonProps) {
  return (
    <button className={cn(styles.base, styles[variant])} onClick={onClick}>
      {children}
    </button>
  );
}
```

### Styling

- Use Tailwind utility classes
- Use `cn()` utility (from `@/lib/utils`) for conditional classes
- CSS variables for theming: `bg-background`, `text-foreground`, `bg-card`, etc.

```tsx
import { cn } from '@/lib/utils';

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

### Import Order (ESLint enforced)

1. Built-in modules (`path`, `fs`)
2. External packages (`react`, `next`, etc.)
3. Internal modules (`@/components`, `@/lib`, etc.)
4. Parent/sibling imports
5. Type imports (last)

```typescript
import { useState } from 'react'
import { NextResponse } from 'next/server'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { localHelper } from './helpers'

import type { DebateSession } from '@/types'
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase in kebab-case file | `theme-toggle.tsx` → `ThemeToggle` |
| Hooks | camelCase with `use` prefix | `use-debate.ts` |
| Utilities | kebab-case | `token-counter.ts` |
| Types | PascalCase | `DebatePhase` |
| Constants | UPPER_SNAKE_CASE | `MAX_TURNS` |

## Path Aliases

Configured in `tsconfig.json`:

```typescript
import { Button } from '@/components/ui/button'  // src/components/ui/button
import { cn } from '@/lib/utils'                 // src/lib/utils
import { useDebate } from '@/hooks/use-debate'   // src/hooks/use-debate
import type { Debate } from '@/types'            // src/types
import { useDebateStore } from '@/store'         // src/store
import { generate } from '@/services/llm'        // src/services/llm
```

## Key Patterns

### LLM Provider Abstraction

The `src/services/llm/` module provides a unified interface for all AI providers:

```typescript
import { generate, generateStream } from '@/services/llm';

// Non-streaming
const result = await generate({
  provider: 'chatgpt', // or 'grok', 'claude', 'openai:gpt-4', 'anthropic:claude-3'
  params: {
    systemPrompt: '...',
    messages: [{ role: 'user', content: '...' }],
    maxTokens: 1000,
    temperature: 0.7,
  },
});

// Streaming
for await (const chunk of generateStream(options)) {
  // Handle streaming chunk
}
```

### State Management

**Zustand** for client state, **TanStack Query** for server state:

```typescript
// Zustand store
import { useDebateStore } from '@/store/debate-store';

const { debatePhase, setPhase, addLocalMessage } = useDebateStore();

// TanStack Query
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

const { data } = useQuery({
  queryKey: queryKeys.debate(debateId),
  queryFn: () => fetchDebate(debateId),
});
```

### Security Layer

All user input passes through the security module:

```typescript
import {
  validateAndSanitizeDebateConfig,
  checkRateLimit,
  filterContent,
} from '@/lib/security';

// Validate and sanitize debate configuration
const validation = await validateAndSanitizeDebateConfig(config, securityContext);

// Check rate limits
const rateLimit = await checkRateLimit(ip, 'debate_creation');
```

### Prompt System

AI prompts are centralized in `src/lib/prompts/`:

```typescript
import {
  buildModeratorSystemPrompt,
  buildDebaterSystemPrompt,
  compileIntroPrompt,
  compileTransitionPrompt,
} from '@/lib/prompts';
```

### Logging

Structured logging with Pino:

```typescript
import { logger, createDebateLogger, logDebateEvent } from '@/lib/logging';

// General logging
logger.info('Message', { context: 'value' });
logger.error('Error occurred', error);

// Debate-specific logging
const log = createDebateLogger(debateId);
log.info('Turn completed', { turnNumber: 5 });
```

## Testing Guidelines

### Unit Tests (Vitest)

- Located alongside source files: `component.tsx` → `__tests__/component.test.tsx`
- Use `@testing-library/react` for component tests
- MSW for API mocking

```typescript
import { render, screen } from '@/test/utils';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### E2E Tests (Playwright)

- Located in `e2e/specs/`
- Use fixtures from `e2e/fixtures/`

```typescript
import { test, expect } from '@playwright/test';

test('creates a debate', async ({ page }) => {
  await page.goto('/debate/new');
  await page.fill('[name="topic"]', 'AI Ethics');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/\/debate\/[a-z0-9]+/);
});
```

### Coverage Thresholds

- Branches: 60%
- Functions: 60%
- Lines: 60%
- Statements: 60%

## Environment Variables

### Required for Development

```bash
OPENAI_API_KEY=sk-...        # OpenAI (ChatGPT)
ANTHROPIC_API_KEY=sk-ant-... # Anthropic (Claude)
XAI_API_KEY=xai-...          # xAI (Grok)
SESSION_SECRET=...           # Base64 encoded secret
```

### Optional Services

```bash
# Real-time (falls back to polling without)
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_KEY=...

# Rate limiting (falls back to in-memory)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Persistence & abuse tracking
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# Monitoring
SENTRY_DSN=...
```

### Feature Flags

```bash
ENABLE_CUSTOM_RULES=true
MAX_DEBATE_TURNS=10
TOKEN_BUDGET_PER_DEBATE=50000
DEBATE_MODE=prod  # 'prod' or 'mock'
BATCH_STREAMING=false  # Reduces Pusher/Redis usage
```

## Git Workflow

### Branch Naming

- `feature/*` - New features
- `fix/*` - Bug fixes
- `hotfix/*` - Critical production fixes
- `release/*` - Release preparation

### Commit Convention (Conventional Commits)

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, perf, test, chore, ci
Scopes: ui, api, debate, auth, config, security
```

Examples:
```
feat(debate): add turn timer
fix(ui): resolve hydration mismatch
test(debate): add unit tests for turn sequencer
```

### Git Hooks (Husky)

- `pre-commit`: lint-staged (ESLint + Prettier)
- `commit-msg`: Validates conventional commit format
- `pre-push`: TypeScript type checking

## CI/CD Pipeline

The CI workflow runs on push/PR to `main` and `dev`:

1. **Lint** - ESLint checks
2. **Type Check** - TypeScript compiler
3. **Build** - Production build
4. **Test** - Vitest unit tests

All checks must pass before merging.

## Common Tasks

### Adding a New API Route

1. Create route file in `src/app/api/[route]/route.ts`
2. Use `NextRequest`/`NextResponse` from `next/server`
3. Add request logging with `@/lib/logging`
4. Validate input with Zod schemas from `@/lib/schemas`
5. Apply security middleware from `@/lib/security`

### Adding a New Component

1. Create in appropriate directory under `src/components/`
2. Use TypeScript interfaces for props
3. Use `cn()` for conditional classes
4. Add tests in `__tests__/` subdirectory
5. Export from barrel file if needed

### Adding a New Hook

1. Create in `src/hooks/` with `use-` prefix
2. Follow React hooks rules
3. Add tests in `__tests__/` subdirectory
4. Export from `src/hooks/index.ts` if shared

### Modifying AI Prompts

1. Edit files in `src/lib/prompts/`
2. Use template compilation functions for dynamic content
3. Test with mock debates (`DEBATE_MODE=mock`)

## Troubleshooting

### TypeScript Errors

- Run `npm run typecheck` for full error output
- Check path aliases in `tsconfig.json`
- Ensure strict null checks are handled

### ESLint Errors

- Run `npm run lint:fix` for auto-fixable issues
- Check import order (enforced by `eslint-plugin-import`)
- Ensure no unused variables (prefix with `_` if intentional)

### Test Failures

- Run specific test: `npm test -- path/to/test.test.ts`
- Check MSW handlers in `src/test/mocks/handlers.ts`
- E2E: Use `npm run test:e2e:headed` to debug visually

### Build Failures

- Clear `.next` directory: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm ci`
- Check for TypeScript errors: `npm run typecheck`
