# Contributing to Debate Lab

Thank you for your interest in contributing to Debate Lab! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Git Branch Strategy](#git-branch-strategy)
- [Branch Naming Convention](#branch-naming-convention)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Local Development](#local-development)
- [Code Standards](#code-standards)

## Git Branch Strategy

```
main        ← Production (protected, requires PR)
  ↑
dev         ← Integration branch (protected, requires PR)
  ↑
feature/*   ← New features (branch from dev)
hotfix/*    ← Emergency fixes (branch from main)
release/*   ← Release prep (branch from dev)
```

### Branch Descriptions

| Branch      | Purpose                   | Base   | Merges Into      |
| ----------- | ------------------------- | ------ | ---------------- |
| `main`      | Production-ready code     | -      | -                |
| `dev`       | Integration and testing   | `main` | `main`           |
| `feature/*` | New features              | `dev`  | `dev`            |
| `fix/*`     | Bug fixes                 | `dev`  | `dev`            |
| `hotfix/*`  | Critical production fixes | `main` | `main` and `dev` |
| `release/*` | Release preparation       | `dev`  | `main` and `dev` |

## Branch Naming Convention

Use descriptive, lowercase names with hyphens:

- `feature/add-debate-timer`
- `feature/user-authentication`
- `fix/123-theme-toggle-bug`
- `hotfix/critical-api-error`
- `release/v1.0.0`

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type       | Description                               |
| ---------- | ----------------------------------------- |
| `feat`     | New feature                               |
| `fix`      | Bug fix                                   |
| `docs`     | Documentation only                        |
| `style`    | Code style (formatting, semicolons, etc.) |
| `refactor` | Code refactoring                          |
| `test`     | Adding or updating tests                  |
| `chore`    | Maintenance tasks                         |
| `perf`     | Performance improvements                  |
| `ci`       | CI/CD changes                             |

### Scopes (Optional)

- `ui` - UI components
- `api` - API routes
- `debate` - Debate functionality
- `auth` - Authentication
- `config` - Configuration

### Examples

```bash
feat(debate): add turn sequencer logic
fix(ui): resolve theme toggle hydration issue
docs: update contributing guidelines
ci: add CodeQL security scanning
refactor(api): simplify error handling
```

## Pull Request Process

1. **Create a feature branch from `dev`**

   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow the code standards
   - Add tests if applicable

3. **Commit with conventional commits**

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push your branch**

   ```bash
   git push -u origin feature/your-feature-name
   ```

5. **Open a Pull Request to `dev`**
   - Fill out the PR template
   - Link related issues
   - Request review

6. **Wait for CI checks to pass**
   - Lint
   - Type check
   - Build
   - Tests

7. **Address review feedback**

8. **Squash and merge after approval**

## Local Development

### Prerequisites

- Node.js 20.x
- npm 10.x

### Setup

```bash
# Clone the repository
git clone https://github.com/dinesh-git17/debate-lab.git
cd debate-lab

# Install dependencies
npm ci

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Available Scripts

| Script                 | Description                             |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start development server with Turbopack |
| `npm run build`        | Create production build                 |
| `npm run start`        | Start production server                 |
| `npm run lint`         | Run ESLint                              |
| `npm run lint:fix`     | Run ESLint with auto-fix                |
| `npm run typecheck`    | Run TypeScript type checking            |
| `npm run format`       | Format code with Prettier               |
| `npm run format:check` | Check code formatting                   |
| `npm run test`         | Run tests                               |

### Pre-commit Hooks

The project uses Husky for Git hooks:

- **pre-commit**: Runs lint-staged (ESLint + Prettier)
- **commit-msg**: Validates commit message format
- **pre-push**: Runs TypeScript type check

## Code Standards

### TypeScript

- Use strict mode
- Explicit return types for functions
- No `any` types (use `unknown` if needed)
- Use `interface` for object types

### React

- Functional components only
- Use `'use client'` directive only when necessary
- Prefer server components by default
- Explicit prop types with interfaces

### Styling

- Use Tailwind CSS utility classes
- Use CSS variables for theming
- Follow the design system tokens

### File Organization

```
src/
├── app/           # Next.js App Router pages
├── components/
│   ├── ui/        # Primitive components
│   ├── features/  # Feature-specific components
│   ├── layouts/   # Layout components
│   └── providers/ # Context providers
├── hooks/         # Custom React hooks
├── lib/           # Utilities and config
├── services/      # API service layer
├── store/         # Zustand stores
└── types/         # TypeScript definitions
```

### Naming Conventions

| Type       | Convention                  | Example           |
| ---------- | --------------------------- | ----------------- |
| Components | PascalCase                  | `ThemeToggle.tsx` |
| Hooks      | camelCase with `use` prefix | `useDebate.ts`    |
| Utilities  | camelCase                   | `formatDate.ts`   |
| Types      | PascalCase                  | `DebatePhase`     |
| Constants  | UPPER_SNAKE_CASE            | `MAX_TURNS`       |

## Questions?

If you have questions, please open an issue with the `question` label.
