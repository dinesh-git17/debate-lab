<p align="center">
  <img src="public/logo/logo-dark.png" alt="Debate Lab" width="200" />
</p>

<h1 align="center">Contributing Guide</h1>

<p align="center">
  <strong>Thank you for helping make Debate Lab better.</strong><br />
  This guide will help you get started with contributing to the project.
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-branch-strategy">Branch Strategy</a> •
  <a href="#-commit-conventions">Commits</a> •
  <a href="#-pull-requests">Pull Requests</a> •
  <a href="#-code-standards">Code Standards</a>
</p>

---

<br />

## 🚀 Quick Start

Get up and running in under 2 minutes:

```bash
# 1. Fork & clone the repository
git clone https://github.com/YOUR_USERNAME/debate-lab.git
cd debate-lab

# 2. Install dependencies
npm ci

# 3. Set up environment
cp .env.example .env.local

# 4. Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** — you're ready to code!

<br />

## 🌳 Branch Strategy

We use a structured branching model to keep development organized:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   main ─────────────────────────────────────────────► Production        │
│     ▲                                                                   │
│     │                                                                   │
│     │  PR + Review                                                      │
│     │                                                                   │
│   dev ──────────────────────────────────────────────► Integration       │
│     ▲                                                                   │
│     │                                                                   │
│     ├── feature/*  ─────────────────────────────────► New Features      │
│     ├── fix/*  ─────────────────────────────────────► Bug Fixes         │
│     └── hotfix/*  ──────────────────────────────────► Critical Fixes    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Branch Types

| Branch | Purpose | Branch From | Merge Into |
|--------|---------|-------------|------------|
| `main` | Production-ready code | — | — |
| `dev` | Integration & testing | `main` | `main` |
| `feature/*` | New features | `dev` | `dev` |
| `fix/*` | Bug fixes | `dev` | `dev` |
| `hotfix/*` | Critical production fixes | `main` | `main` + `dev` |
| `release/*` | Release preparation | `dev` | `main` + `dev` |

### Naming Examples

```bash
feature/add-debate-timer        # New feature
feature/user-authentication     # New feature
fix/123-theme-toggle-bug        # Bug fix (with issue number)
hotfix/critical-api-error       # Emergency fix
release/v1.0.0                  # Release branch
```

<br />

## 📝 Commit Conventions

We follow **[Conventional Commits](https://www.conventionalcommits.org/)** for clear, automated changelogs.

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

| Type | Icon | Description | Example |
|------|:----:|-------------|---------|
| `feat` | ✨ | New feature | `feat(debate): add turn timer` |
| `fix` | 🐛 | Bug fix | `fix(ui): resolve hydration mismatch` |
| `docs` | 📚 | Documentation | `docs: update API reference` |
| `style` | 💅 | Code style (formatting) | `style: fix indentation` |
| `refactor` | ♻️ | Code refactoring | `refactor(api): simplify error handling` |
| `perf` | ⚡ | Performance improvement | `perf: optimize bundle size` |
| `test` | 🧪 | Adding/updating tests | `test(debate): add unit tests` |
| `chore` | 🔧 | Maintenance tasks | `chore: update dependencies` |
| `ci` | 🔄 | CI/CD changes | `ci: add CodeQL scanning` |

### Scopes

| Scope | Area |
|-------|------|
| `ui` | UI components |
| `api` | API routes |
| `debate` | Debate functionality |
| `auth` | Authentication |
| `config` | Configuration |
| `security` | Security features |

<br />

## 🔀 Pull Requests

### Step-by-Step Process

<table>
<tr>
<td width="60">

**1**

</td>
<td>

**Create a feature branch**

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

</td>
</tr>
<tr>
<td>

**2**

</td>
<td>

**Make your changes**

- Write clean, documented code
- Follow the [code standards](#-code-standards)
- Add tests for new functionality

</td>
</tr>
<tr>
<td>

**3**

</td>
<td>

**Commit with conventional commits**

```bash
git add .
git commit -m "feat(scope): add new feature"
```

</td>
</tr>
<tr>
<td>

**4**

</td>
<td>

**Push your branch**

```bash
git push -u origin feature/your-feature-name
```

</td>
</tr>
<tr>
<td>

**5**

</td>
<td>

**Open a Pull Request**

- Target the `dev` branch
- Fill out the PR template completely
- Link related issues
- Request review from maintainers

</td>
</tr>
<tr>
<td>

**6**

</td>
<td>

**Wait for CI checks**

All checks must pass:
- ✅ ESLint
- ✅ TypeScript
- ✅ Build
- ✅ Unit Tests
- ✅ E2E Tests

</td>
</tr>
<tr>
<td>

**7**

</td>
<td>

**Address feedback & merge**

- Respond to review comments
- Make requested changes
- Squash and merge after approval

</td>
</tr>
</table>

<br />

## 🛠️ Development Environment

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20.x+ | JavaScript runtime |
| npm | 10.x+ | Package manager |
| Git | Latest | Version control |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run typecheck` | Run TypeScript checks |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:e2e` | Run Playwright E2E tests |

### Git Hooks (Husky)

Automatic quality checks run on every commit:

| Hook | Action |
|------|--------|
| `pre-commit` | Runs lint-staged (ESLint + Prettier) |
| `commit-msg` | Validates conventional commit format |
| `pre-push` | Runs TypeScript type checking |

<br />

## 📐 Code Standards

### TypeScript

```typescript
// ✅ Do: Explicit return types
function calculateScore(turns: Turn[]): number {
  return turns.reduce((sum, turn) => sum + turn.score, 0);
}

// ✅ Do: Use interfaces for objects
interface DebateConfig {
  topic: string;
  rounds: number;
  timeLimit: number;
}

// ❌ Don't: Use `any`
function processData(data: any) { ... }

// ✅ Do: Use `unknown` when type is truly unknown
function processData(data: unknown) { ... }
```

### React

```tsx
// ✅ Do: Functional components with typed props
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

// ✅ Do: Use 'use client' only when necessary
// ✅ Do: Prefer Server Components by default
```

### Styling

```tsx
// ✅ Do: Use Tailwind utility classes
<div className="flex items-center gap-4 rounded-lg bg-card p-6">

// ✅ Do: Use CSS variables for theming
<div className="bg-background text-foreground">

// ✅ Do: Use cn() for conditional classes
<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary text-white",
  isDisabled && "opacity-50 cursor-not-allowed"
)}>
```

<br />

## 📁 File Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (debate)/           # Debate creation routes
│   ├── (fullscreen)/       # Immersive debate experience
│   ├── (marketing)/        # Landing & info pages
│   └── api/                # REST API endpoints
│
├── components/
│   ├── ui/                 # Design system primitives
│   ├── features/           # Feature-specific components
│   ├── debate/             # Debate UI components
│   └── providers/          # Context providers
│
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and configuration
├── services/               # API service layer
├── store/                  # Zustand state stores
└── types/                  # TypeScript definitions
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ThemeToggle.tsx` |
| Hooks | camelCase with `use` prefix | `useDebate.ts` |
| Utilities | camelCase | `formatDate.ts` |
| Types/Interfaces | PascalCase | `DebatePhase` |
| Constants | UPPER_SNAKE_CASE | `MAX_TURNS` |
| Files | kebab-case | `debate-engine.ts` |

<br />

## ✅ PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] Tests added for new functionality
- [ ] All tests passing locally
- [ ] No console errors or warnings
- [ ] Commit messages follow conventions

<br />

## 💬 Getting Help

| Resource | Description |
|----------|-------------|
| [GitHub Issues](https://github.com/dinesh-git17/debate-lab/issues) | Report bugs or request features |
| [Discussions](https://github.com/dinesh-git17/debate-lab/discussions) | Ask questions and share ideas |

When opening an issue, please use the appropriate label:

| Label | Use For |
|-------|---------|
| `bug` | Something isn't working |
| `enhancement` | New feature request |
| `question` | Questions about the project |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |

---

<p align="center">
  <sub>We appreciate every contribution, big or small. Thank you for being part of Debate Lab!</sub>
</p>
