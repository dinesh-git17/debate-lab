<p align="center">
  <img src="public/logo/logo-dark.png" alt="Debate Lab" width="280" />
</p>

<p align="center">
  <strong>Watch the world's leading AI models debate any topic in real-time.</strong>
</p>

<p align="center">
  <a href="https://github.com/dinesh-git17/debate-lab/actions/workflows/ci.yml"><img src="https://github.com/dinesh-git17/debate-lab/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/dinesh-git17/debate-lab/actions/workflows/codeql.yml"><img src="https://github.com/dinesh-git17/debate-lab/actions/workflows/codeql.yml/badge.svg" alt="CodeQL"></a>
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white" alt="Next.js 15">
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/License-Elastic%202.0-blue" alt="License">
</p>

<br />

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#%EF%B8%8F-tech-stack">Tech Stack</a> •
  <a href="#-documentation">Documentation</a> •
  <a href="#-ai-assisted-development">AI Development</a>
</p>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🤖 Real AI Debates
Not scripted. Not simulated. Watch **ChatGPT** and **Grok** engage in genuine intellectual discourse with real reasoning, real arguments, and real-time responses.

### ⚖️ Neutral Moderation
**Claude** serves as an impartial moderator, ensuring balanced discussion, enforcing debate rules, and providing insightful interventions when needed.

### 🌍 Any Topic
From technology and politics to philosophy and ethics — you define the subject, and the AI models bring the discourse.

</td>
<td width="50%">

### ⚡ Real-Time Streaming
Experience debates as they unfold with live streaming responses. No waiting, no refreshing — just pure, uninterrupted AI discourse.

### 📊 Comprehensive Judging
Get detailed scoring, clash analysis, and educational insights from an AI judge that evaluates argumentation quality, evidence usage, and rhetorical effectiveness.

### 🔗 Share & Export
Generate shareable links, export full transcripts in multiple formats (Markdown, JSON, PDF), and embed debates anywhere.

</td>
</tr>
</table>

<br />

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│    1. CHOOSE           2. WATCH              3. LEARN                   │
│                                                                         │
│    ┌─────────┐        ┌─────────────┐        ┌─────────────┐            │
│    │  Topic  │   ──►  │  Real-Time  │   ──►  │   Scoring   │            │
│    │  + Rules│        │   Debate    │        │   Summary   │            │
│    └─────────┘        └─────────────┘        └─────────────┘            │
│                                                                         │
│    Pick any topic      ChatGPT & Grok        Get detailed               │
│    and customize       argue while Claude    analysis and               │
│    debate rules        moderates             key insights               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

<br />

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or higher
- **npm** 10.x or higher
- API keys for [OpenAI](https://platform.openai.com), [Anthropic](https://console.anthropic.com), and [xAI](https://console.x.ai)

### Installation

```bash
# Clone the repository
git clone https://github.com/dinesh-git17/debate-lab.git
cd debate-lab

# Install dependencies
npm ci

# Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** and start your first debate.

<br />

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="48" height="48" alt="Next.js" />
<br /><strong>Next.js 15</strong>
<br /><sub>App Router</sub>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" height="48" alt="TypeScript" />
<br /><strong>TypeScript</strong>
<br /><sub>Type Safety</sub>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg" width="48" height="48" alt="Tailwind" />
<br /><strong>Tailwind 4</strong>
<br /><sub>Styling</sub>
</td>
<td align="center" width="140">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" height="48" alt="React" />
<br /><strong>React 19</strong>
<br /><sub>UI Library</sub>
</td>
</tr>
</table>

### Architecture

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Framer Motion | Interactive UI with fluid animations |
| **Styling** | Tailwind CSS 4, CSS Variables | Design system with dark/light themes |
| **State** | Zustand, TanStack Query | Client state + server cache |
| **Real-time** | Pusher, SSE | Live streaming updates |
| **AI Providers** | OpenAI, Anthropic, xAI | Multi-model orchestration |
| **Validation** | Zod, React Hook Form | Schema-first form handling |
| **Testing** | Vitest, Playwright, MSW | Unit, integration & E2E tests |
| **Monitoring** | Sentry, Web Vitals | Error tracking & performance |

<br />

## 📁 Project Structure

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
│   ├── judge/              # Scoring & analysis views
│   └── summary/            # Post-debate summaries
│
├── services/
│   ├── llm/                # AI provider abstraction
│   ├── debate-engine.ts    # Core debate orchestration
│   ├── judge-service.ts    # Scoring & evaluation
│   └── turn-sequencer.ts   # Turn management
│
├── lib/
│   ├── security/           # Rate limiting, content filtering
│   ├── logging/            # Structured logging, metrics
│   ├── prompts/            # AI prompt templates
│   └── performance/        # Optimization utilities
│
├── hooks/                  # Custom React hooks
├── store/                  # Zustand state stores
└── types/                  # TypeScript definitions
```

<br />

## ⚙️ Configuration

### Environment Variables

Create `.env.local` from the example and configure:

| Variable | Required | Description |
|----------|:--------:|-------------|
| `OPENAI_API_KEY` | ✓ | OpenAI API key (GPT-4) |
| `ANTHROPIC_API_KEY` | ✓ | Anthropic API key (Claude) |
| `XAI_API_KEY` | ✓ | xAI API key (Grok) |
| `SESSION_SECRET` | ✓ | Session encryption secret |
| `PUSHER_*` | | Real-time event streaming |
| `UPSTASH_*` | | Redis for rate limiting |
| `SUPABASE_*` | | Persistence & abuse tracking |
| `SENTRY_DSN` | | Error monitoring |

### Feature Flags

```bash
ENABLE_CUSTOM_RULES=true     # Allow custom debate rules
MAX_DEBATE_TURNS=10          # Maximum turns per debate
TOKEN_BUDGET_PER_DEBATE=50000  # Token limit per debate
DEBATE_MODE=prod             # 'prod' or 'mock' for testing
```

<br />

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Create optimized production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |
| `npm run typecheck` | Run TypeScript compiler checks |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run format` | Format code with Prettier |

<br />

## 🔒 Security

Debate Lab implements defense-in-depth security:

- **Rate Limiting** — Configurable per-IP and per-session limits
- **Content Filtering** — Multi-layer content moderation (regex + semantic + OpenAI moderation API)
- **Input Sanitization** — XSS prevention and injection protection
- **Abuse Tracking** — Privacy-preserving IP hashing with automatic bans
- **CSP Headers** — Strict Content Security Policy enforcement
- **API Authentication** — Secure admin endpoints with API key validation

<br />

## 📖 Documentation

| Resource | Description |
|----------|-------------|
| [Contributing Guide](CONTRIBUTING.md) | Branch strategy, commit conventions, PR process |
| [Debate Rules](src/data/debate-rules.ts) | Built-in debate rule definitions |
| [API Routes](src/app/api) | REST API endpoint implementations |

<br />

## 🤝 Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) for details on our development workflow, coding standards, and pull request process.

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git commit -m "feat(scope): description"

# Push and create a PR
git push -u origin feature/your-feature-name
```

<br />

## 🤖 AI-Assisted Development

If you're using an AI assistant (Claude, ChatGPT, Cursor, Copilot, etc.) to work on this codebase, **have it read the guidelines first**:

```
Before making any changes, read CLAUDE.md in the project root.
Follow all coding standards and rules defined there.
```

The `CLAUDE.md` file contains:
- Critical rules (commit guidelines, build restrictions)
- Code quality standards (FAANG-level expectations)
- Comment standards and forbidden patterns
- TypeScript, security, and accessibility requirements
- Project architecture and key patterns

This ensures consistent, production-quality contributions regardless of which AI tool you use.

<br />

## 📄 License

This project is licensed under the **[Elastic License 2.0](LICENSE)**.

<table>
<tr>
<td>✅ Free for personal and internal use</td>
<td>✅ Modify and distribute source code</td>
</tr>
<tr>
<td>❌ Cannot offer as a managed service</td>
<td>❌ Cannot circumvent license protections</td>
</tr>
</table>

For commercial SaaS licensing, please contact the repository owner.

---

<p align="center">
  <sub>Built with ❤️ for the AI research community</sub>
</p>

<p align="center">
  <a href="https://github.com/dinesh-git17/debate-lab/issues">Report Bug</a> •
  <a href="https://github.com/dinesh-git17/debate-lab/issues">Request Feature</a>
</p>
