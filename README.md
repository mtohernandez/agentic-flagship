# Agentic Flagship

![Showcase](https://github.com/user-attachments/assets/56b438ab-da70-451f-b2b3-0c262d96bb67)

A chat interface for an AI agent that scrapes websites. You send a prompt describing what you need, and the agent streams back its response in real time — showing you what it's thinking and doing as it works.

## How it works

The app is a Next.js frontend that talks to a separate backend service through a BFF (Backend-For-Frontend) proxy. The full flow looks like this:

```
Browser  →  Next.js API route  →  Backend agent service
  chat UI      (BFF proxy)          (runs the agent)
```

1. The user pastes a URL into the input bar and picks a scrape action
2. They click **+** to queue one or more jobs, then hit submit (or press Enter)
3. The frontend sends a **GET** request with `?prompt=` to the Next.js API route
4. The API route proxies the request to the backend service
5. The backend streams back **Server-Sent Events (SSE)** — token by token
6. The frontend parses the stream and updates the chat in real time

The agent sends two types of events:

- **Tokens** — the actual response text, streamed incrementally
- **Thoughts** — the agent's internal reasoning steps, displayed inline

## Architecture

The project follows [Feature-Sliced Design](https://feature-sliced.design/) (FSD), which organizes code into layers by responsibility:

```
app/                    → Pages and API routes (Next.js App Router)
  api/agent/run-mission/  → BFF proxy endpoint
  page.tsx                → Root redirect to /chat
  chat/page.tsx           → Main chat page

widgets/                → Full UI sections composed from smaller pieces
  chat-panel/             → Message list + mission form

features/               → User-facing functionality with business logic
  run-mission/            → Mission form, job queue, streaming hook, prompt builder

entities/               → Domain models and their UI representations
  message/                → Message types (user/agent), MessageBubble, MessageList
  agent/                  → Thought types, InlineThoughts, ThoughtItem

shared/                 → Infrastructure used across all layers
  api/                    → API client, SSE parser, proxy helpers, error types
  mocks/                  → Mock messages for development

components/             → Shared UI primitives
  ui/                     → Button, Input, Select, Textarea, Spinner, etc.
  theme-toggle.tsx        → Dark/light mode toggle
  dev/                    → Development toolbar and scenario loader
```

**Key rule of FSD:** layers can only import from layers below them. A feature can use an entity, but an entity can never import from a feature.

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- A running backend service that exposes `GET /run-mission?prompt=`

### Setup

```bash
pnpm install
cp .env.example .env.local
```

Edit `.env.local` and set `BACKEND_URL` to point to your backend:

```
BACKEND_URL=http://localhost:8000
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/chat`.

A dev toolbar is available in development mode (bottom-right corner) to load mock scenarios, simulate streaming, and toggle loading states.

### Testing

```bash
pnpm test:run
```

## Tech stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 16 (App Router)             |
| Language     | TypeScript (strict)                 |
| Styling      | Tailwind CSS 4 + shadcn/ui          |
| Testing      | Vitest + React Testing Library      |
| Code quality | ESLint, Prettier, Husky, Commitlint |
