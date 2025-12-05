# CLAUDE.md - AI Assistant Guide for Debate Lab

## Project Overview

Debate Lab is an interactive web platform where AI models (ChatGPT and Grok) debate topics while Claude moderates and judges the discussion. Users create debates by specifying a topic, turn count, format, and optional custom rules, then watch the AI debate unfold in real-time via Server-Sent Events (SSE).

**Repository:** `github.com/dinesh-git17/debate-lab`

## Quick Reference

```bash
# Start development
npm run dev          # Turbopack (fast)

# Quality checks
npm run lint         # ESLint
npm run typecheck    # TypeScript strict mode
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests

# Build
npm run build        # Production build
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 |
| Client State | Zustand |
| Server State | TanStack Query 5 |
| Forms | React Hook Form + Zod |
| LLM Providers | OpenAI (GPT-5.1), Anthropic (Claude), xAI (Grok) |
| Database | Supabase (PostgreSQL) + Upstash Redis (optional) |
| Testing | Vitest + Playwright |
| Monitoring | Sentry + Pino logging |

## Architecture

### Layered Structure

```
UI Components (React Server/Client)
        ↓
Custom Hooks (use-debate, use-debate-stream)
        ↓
State Management (Zustand + TanStack Query)
        ↓
API Routes (/api/*)
        ↓
Services (debate-engine, llm-service, judge-service)
        ↓
Core Utilities (lib/ - prompts, security, logging)
        ↓
External Services (LLM APIs, Supabase, Redis)
```

### Debate Engine State Machine

```
idle → configuring → validating → ready → active → completed
                                    ↓         ↑
                                  paused ─────┘
```

### Real-time Streaming

Debates stream via SSE from `/api/debate/[id]/engine`:
- Events: `turn_started`, `message_received`, `debate_completed`, `error`
- Client hooks (`use-debate-stream.ts`) manage subscription lifecycle
- `DebateEventEmitter` (pub-sub) coordinates between engine and API

## Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (debate)/             # Debate routes (create, view, judge, summary)
│   ├── (marketing)/          # Marketing pages (home, about, terms)
│   ├── api/                  # API routes
│   │   ├── debate/           # Core debate endpoints
│   │   │   ├── route.ts      # POST create, GET list
│   │   │   └── [id]/
│   │   │       ├── route.ts  # GET session
│   │   │       ├── engine/   # POST start, GET state/stream
│   │   │       ├── judge/    # GET analysis
│   │   │       ├── summary/  # GET summary
│   │   │       ├── budget/   # GET token usage
│   │   │       └── export/   # GET transcript
│   │   ├── admin/            # Admin endpoints (bans)
│   │   ├── health/           # Health checks
│   │   └── validate-rules/   # Rule validation
│   ├── embed/[id]/           # Embeddable widget
│   └── s/[code]/             # Short URL redirects
├── components/
│   ├── ui/                   # Primitives (button, input, dialog)
│   ├── features/             # Feature components (debate-form, ai-models-section)
│   ├── debate/               # Debate UI (message-list, message-bubble)
│   ├── judge/                # Judge analysis (score-display, clash-analysis)
│   ├── layouts/              # Layout components
│   └── providers/            # Context providers (theme, query)
├── hooks/                    # Custom hooks
│   ├── use-debate.ts         # Main debate state hook
│   ├── use-debate-stream.ts  # SSE streaming hook
│   ├── use-create-debate.ts  # Mutation hook for creation
│   └── use-keyboard-shortcuts.ts
├── lib/                      # Utilities
│   ├── prompts/              # LLM prompt templates
│   │   ├── debater-prompt.ts
│   │   ├── judge-prompt.ts
│   │   └── moderator-system.ts
│   ├── security/             # Content filtering, rate limiting
│   │   ├── validate-input.ts # Hybrid validator (regex + OpenAI moderation)
│   │   ├── content-filter.ts
│   │   ├── abuse-tracker.ts
│   │   └── rate-limiter.ts
│   ├── logging/              # Pino + Supabase logging
│   ├── performance/          # Caching, prefetch, web vitals
│   ├── schemas/              # Zod validation schemas
│   ├── debate-events.ts      # Event emitter
│   ├── debate-formats.ts     # Format configs (standard, oxford, lincoln-douglas)
│   ├── session-store.ts      # In-memory + Redis sessions
│   ├── engine-store.ts       # Engine state persistence
│   └── token-counter.ts      # Tiktoken wrapper
├── services/                 # Business logic
│   ├── debate-engine.ts      # Core orchestration
│   ├── debate-service.ts     # CRUD operations
│   ├── judge-service.ts      # Claude analysis
│   ├── budget-manager.ts     # Token budget tracking
│   ├── turn-sequencer.ts     # Turn FSM
│   └── llm/                  # Provider abstraction
│       ├── llm-service.ts    # High-level interface
│       ├── provider-factory.ts
│       ├── openai-provider.ts
│       ├── anthropic-provider.ts
│       └── xai-provider.ts
├── store/                    # Zustand stores
│   ├── debate-store.ts       # Debate UI state
│   ├── judge-store.ts        # Judge state
│   └── ui-store.ts           # General UI
├── types/                    # TypeScript definitions
│   ├── debate.ts
│   ├── judge.ts
│   ├── turn.ts
│   ├── llm.ts
│   └── security.ts
└── data/                     # Static data
    └── debate-rules.ts
```

## Code Conventions

### TypeScript

- **Strict mode enabled** with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`
- Use `interface` for object types, `type` for unions/intersections
- Explicit return types on exported functions
- Never use `any` - prefer `unknown` with type guards
- Path aliases: `@/*` maps to `src/*`

### React

- **Server Components by default** - only add `'use client'` when needed
- Functional components with typed props via interfaces
- Hooks in `hooks/` directory with `use-` prefix
- Co-locate component tests: `component.test.tsx` next to `component.tsx`

### Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `MessageBubble.tsx` |
| Hooks | camelCase + use prefix | `use-debate-stream.ts` |
| Services | kebab-case + suffix | `debate-service.ts` |
| Types | PascalCase | `DebatePhase`, `JudgeAnalysis` |
| Constants | UPPER_SNAKE_CASE | `MAX_TURNS`, `TOKEN_BUDGET_PER_DEBATE` |
| API routes | kebab-case directories | `/api/debate/[id]/engine/route.ts` |

### Styling

- Tailwind CSS utility classes
- CSS variables for theming (defined in `globals.css`)
- Framer Motion for animations
- Radix UI primitives for accessible components

## API Endpoints

### Core Debate Flow

```
POST /api/debate                    # Create debate → { debateId, session }
GET  /api/debate/[id]               # Get session
POST /api/debate/[id]/engine        # Start debate → SSE stream
GET  /api/debate/[id]/engine        # Get engine state
GET  /api/debate/[id]/judge         # Get Claude's analysis
GET  /api/debate/[id]/summary       # Get summary
GET  /api/debate/[id]/budget        # Get token usage
GET  /api/debate/[id]/export        # Download transcript
```

### Utilities

```
POST /api/debate/estimate           # Estimate tokens/cost
POST /api/validate-rules            # Validate custom rules
GET  /api/health                    # Health check
GET  /api/providers/health          # LLM provider status
```

### Admin

```
GET/POST /api/admin/bans            # Manage IP bans (requires ADMIN_API_KEY)
```

## Environment Variables

**Required for basic functionality:**
```bash
OPENAI_API_KEY           # GPT-5.1 access
ANTHROPIC_API_KEY        # Claude access
XAI_API_KEY              # Grok access
SESSION_SECRET           # Base64-encoded session secret
```

**Recommended for production:**
```bash
UPSTASH_REDIS_REST_URL   # State persistence on Vercel
UPSTASH_REDIS_REST_TOKEN
SUPABASE_URL             # Logging, abuse tracking
SUPABASE_SERVICE_ROLE_KEY
IP_HASH_SALT             # Privacy-preserving IP hashing
```

**Feature flags:**
```bash
ENABLE_CUSTOM_RULES=true
MAX_DEBATE_TURNS=10
TOKEN_BUDGET_PER_DEBATE=50000
MAX_TOKENS_PER_TURN=2000
```

## Testing

### Unit/Integration Tests (Vitest)

```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report
```

- Tests live next to source files: `*.test.ts` or `*.spec.ts`
- Coverage threshold: 60%
- Mock external services with MSW
- Test setup in `src/test/setup.ts`

### E2E Tests (Playwright)

```bash
npm run test:e2e          # Headless
npm run test:e2e:headed   # With browser UI
npm run test:e2e:ui       # Interactive UI mode
```

- Tests in `e2e/specs/`
- Fixtures in `e2e/fixtures/`
- Multi-browser: Chromium, Firefox, WebKit

## Security Considerations

### Content Filtering (Defense in Depth)

1. **Zod schema validation** - Structure and type checks
2. **Regex content filter** - Fast pattern matching (`lib/security/content-filter.ts`)
3. **OpenAI Moderation API** - Secondary check for flagged content
4. **Sanitization** - DOMPurify for output
5. **Rate limiting** - Per-IP request limits
6. **Abuse tracking** - Supabase-backed IP reputation

### Input Validation

Always validate user input with Zod schemas (`lib/schemas/debate-schema.ts`):
```typescript
import { createDebateSchema } from '@/lib/schemas/debate-schema';
const result = createDebateSchema.safeParse(input);
```

### Sensitive Data

- Never log full API keys or user IPs
- Use `IP_HASH_SALT` for privacy-preserving IP tracking
- Session secrets must be base64-encoded

## Common Development Tasks

### Adding a New Debate Format

1. Add format config in `lib/debate-formats.ts`
2. Update `DebateFormat` type in `types/debate.ts`
3. Add turn sequence logic in `services/turn-sequencer.ts`
4. Update form options in `components/features/debate-form.tsx`

### Adding a New LLM Provider

1. Create provider in `services/llm/[provider]-provider.ts`
2. Extend `BaseLLMProvider` abstract class
3. Register in `services/llm/provider-factory.ts`
4. Add types in `types/llm.ts`
5. Add pricing info in `lib/provider-pricing.ts`

### Modifying Prompts

Prompts live in `lib/prompts/`:
- `debater-prompt.ts` - Instructions for debating AI
- `judge-prompt.ts` - Claude's analysis instructions
- `moderator-system.ts` - Turn moderation
- Compiled via `services/prompt-compiler.ts`

### Adding New API Route

1. Create `route.ts` in `app/api/[path]/`
2. Use `NextRequest`/`NextResponse`
3. Validate input with Zod
4. Add error handling with structured responses
5. Log with `lib/logging/logger.ts`

## Git Workflow

### Branch Strategy

```
main (production) ← dev (integration) ← feature/*, fix/*
```

### Commit Messages (Conventional Commits)

```
feat(debate): add oxford debate format
fix(ui): resolve hydration mismatch in theme toggle
refactor(api): simplify error response handling
test(judge): add unit tests for scoring logic
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

**Scopes:** `ui`, `api`, `debate`, `llm`, `security`, `config`

### Pre-commit Hooks

- **pre-commit:** ESLint + Prettier via lint-staged
- **commit-msg:** Validates conventional commit format
- **pre-push:** TypeScript type checking

## Debugging Tips

### Debate Engine Issues

- Check engine state: `GET /api/debate/[id]/engine`
- Logs in console include `[DebateEngine]` prefix
- Engine store: `lib/engine-store.ts` (Redis or in-memory)

### LLM Failures

- Check provider health: `GET /api/providers/health`
- Retry logic in `lib/retry.ts`
- Logs include provider name and latency

### Token Budget

- Current usage: `GET /api/debate/[id]/budget`
- Budget manager: `services/budget-manager.ts`
- Token counting: `lib/token-counter.ts` (uses Tiktoken)

### Streaming Issues

- SSE events logged with request ID
- Event emitter: `lib/debate-events.ts`
- Client hook: `hooks/use-debate-stream.ts`

## Performance Notes

- **Turbopack** for fast dev rebuilds
- **Server Components** reduce client bundle
- **TanStack Query** caches API responses
- Image optimization via `next/image` with AVIF/WebP
- Code splitting configured in `next.config.ts`
- Web Vitals tracked via `lib/performance/web-vitals.ts`

## External Documentation

- [Next.js 15 Docs](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [OpenAI API](https://platform.openai.com/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [Supabase](https://supabase.com/docs)
