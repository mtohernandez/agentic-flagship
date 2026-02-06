# Agentic Flagship

A chat interface for an AI agent that scrapes websites. You send a prompt describing what you need, and the agent streams back its response in real time — showing you what it's thinking and doing as it works.

## How it works

The app is a Next.js frontend that talks to a separate backend service through a BFF (Backend-For-Frontend) proxy. The full flow looks like this:

```
Browser  →  Next.js API route  →  Backend agent service
  chat UI      (BFF proxy)          (runs the agent)
```

1. The user types a mission prompt in the chat
2. The frontend sends a **GET** request with `?prompt=` to the Next.js API route
3. The API route proxies the request to the backend service
4. The backend streams back **Server-Sent Events (SSE)** — token by token
5. The frontend parses the stream and updates the chat in real time

The agent sends two types of events:

- **Tokens** — the actual response text, streamed incrementally
- **Thoughts** — the agent's internal reasoning steps, displayed in a collapsible panel

## Architecture

The project follows [Feature-Sliced Design](https://feature-sliced.design/) (FSD), which organizes code into layers by responsibility:

```
app/                    → Pages and API routes (Next.js App Router)
  api/agent/run-mission/  → BFF proxy endpoint
  page.tsx                → Main chat page

widgets/                → Full UI sections composed from smaller pieces
  chat-panel/             → Chat header + message list + input form

features/               → User-facing functionality with business logic
  run-mission/            → Hook that manages streaming, messages, and state

entities/               → Domain models and their UI representations
  message/                → Message types (user/agent), MessageBubble, MessageList
  agent/                  → Thought types, ThinkingIndicator, InlineThoughts

shared/                 → Infrastructure used across all layers
  api/                    → API client, SSE parser, proxy helpers, error types
  types/                  → Shared type definitions
  lib/                    → Utility functions
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

Open [http://localhost:3000](http://localhost:3000).

### Testing

```bash
pnpm vitest run
```

## Tech stack

| Layer        | Technology                          |
| ------------ | ----------------------------------- |
| Framework    | Next.js 16 (App Router)             |
| Language     | TypeScript (strict)                 |
| Styling      | Tailwind CSS 4 + shadcn/ui          |
| Testing      | Vitest + React Testing Library      |
| Code quality | ESLint, Prettier, Husky, Commitlint |
