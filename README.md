# Debate Lab

![CI](https://github.com/dinesh-git17/debate-lab/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/dinesh-git17/debate-lab/actions/workflows/codeql.yml/badge.svg)

A debate platform where AI models (ChatGPT and Grok) debate topics while Claude moderates the discussion.

## Quick Start

### Prerequisites

- Node.js 20.x
- npm 10.x

### Installation

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

Open [http://localhost:3000](http://localhost:3000) to view the application.

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

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (debate)/     # Debate route group
│   ├── (marketing)/  # Marketing route group
│   └── api/          # API routes
├── components/
│   ├── ui/           # Primitive UI components
│   ├── features/     # Feature-specific components
│   ├── layouts/      # Layout components
│   └── providers/    # Context providers
├── hooks/            # Custom React hooks
├── lib/              # Utilities and configuration
├── services/         # API service layer
├── store/            # Zustand state stores
└── types/            # TypeScript type definitions
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand + TanStack Query
- **Form Handling:** React Hook Form + Zod
- **AI SDKs:** OpenAI, Anthropic, xAI

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable            | Required | Description                  |
| ------------------- | -------- | ---------------------------- |
| `OPENAI_API_KEY`    | Yes      | OpenAI API key for ChatGPT   |
| `ANTHROPIC_API_KEY` | Yes      | Anthropic API key for Claude |
| `XAI_API_KEY`       | Yes      | xAI API key for Grok         |
| `SESSION_SECRET`    | Yes      | Session encryption secret    |
| `SENTRY_DSN`        | No       | Sentry error tracking DSN    |

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, branch strategy, and the process for submitting pull requests.

## License

This project is licensed under the [Elastic License 2.0](LICENSE). This means:

- ✅ Free to use, modify, and distribute the source code
- ✅ Can use for internal/non-commercial purposes
- ❌ Cannot provide as a hosted/managed service to third parties
- ❌ Cannot remove or circumvent license protections

For commercial SaaS use or other licensing options, please contact the repository owner.
