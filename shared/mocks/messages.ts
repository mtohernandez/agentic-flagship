import type { UserMessage, AgentMessage, Message, AgentThought } from '@/shared/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function thought(
  id: string,
  type: AgentThought['type'],
  content: string,
  status: AgentThought['status']
): AgentThought {
  return { id, type, content, status, timestamp: new Date('2025-06-15T10:00:00Z') };
}

// ── User Messages ────────────────────────────────────────────────────────────

export const MOCK_USER_MESSAGE: UserMessage = {
  id: 'mock-user-1',
  role: 'user',
  content: 'Scrape the top 10 Hacker News stories and summarize each one in a single sentence.',
  timestamp: new Date('2025-06-15T10:00:00Z'),
};

// ── Agent Messages ───────────────────────────────────────────────────────────

export const MOCK_AGENT_PENDING: AgentMessage = {
  id: 'mock-agent-pending',
  role: 'agent',
  content: '',
  status: 'pending',
  thoughts: [],
  timestamp: new Date('2025-06-15T10:00:01Z'),
};

export const MOCK_AGENT_STREAMING: AgentMessage = {
  id: 'mock-agent-streaming',
  role: 'agent',
  content: 'Fetching the Hacker News front page and extracting the top 10 stories…',
  status: 'streaming',
  thoughts: [],
  timestamp: new Date('2025-06-15T10:00:02Z'),
};

export const MOCK_AGENT_STREAMING_WITH_THOUGHTS: AgentMessage = {
  id: 'mock-agent-streaming-thoughts',
  role: 'agent',
  content: 'Analyzing the first batch of stories…',
  status: 'streaming',
  thoughts: [
    thought(
      't-1',
      'thought',
      'I need to fetch https://news.ycombinator.com and parse the HTML.',
      'complete'
    ),
    thought('t-2', 'action', 'GET https://news.ycombinator.com — 200 OK (1.2 s)', 'complete'),
    thought('t-3', 'thought', 'Extracting story titles and URLs from the DOM…', 'executing'),
  ],
  activeThoughtId: 't-3',
  timestamp: new Date('2025-06-15T10:00:03Z'),
};

export const MOCK_AGENT_COMPLETE: AgentMessage = {
  id: 'mock-agent-complete',
  role: 'agent',
  content:
    'Here are the top 10 Hacker News stories:\n\n' +
    '1. **Show HN: I built a real-time multiplayer game in Rust** — A developer shares a WebSocket-based game engine written entirely in Rust.\n' +
    "2. **SQLite as a document database** — An exploration of using SQLite's JSON1 extension for document storage.\n" +
    '3. **The hidden cost of microservices** — A post-mortem revealing how a migration to microservices tripled infrastructure costs.\n' +
    '4. **Why we switched from React to HTMX** — A small team explains their move back to server-rendered HTML.\n' +
    '5. **Launch HN: OpenPilot (YC S23)** — An open-source autopilot system for commercial drones.\n' +
    '6. **Understanding CPU branch prediction** — A deep dive into how modern CPUs predict branches and why it matters.\n' +
    '7. **PostgreSQL 17 released** — Major new version with improved JSON support and parallel query performance.\n' +
    '8. **A love letter to plain text** — An essay arguing that plain text is the most durable data format.\n' +
    '9. **Reverse engineering the Spotify protocol** — A security researcher documents the proprietary protocol used by Spotify Connect.\n' +
    '10. **The art of finishing projects** — Advice on shipping side projects instead of abandoning them.',
  status: 'complete',
  thoughts: [],
  timestamp: new Date('2025-06-15T10:00:10Z'),
};

export const MOCK_AGENT_COMPLETE_WITH_THOUGHTS: AgentMessage = {
  id: 'mock-agent-complete-thoughts',
  role: 'agent',
  content: MOCK_AGENT_COMPLETE.content,
  status: 'complete',
  thoughts: [
    thought(
      't-c1',
      'thought',
      'I need to fetch the HN front page and parse the top 10 stories.',
      'complete'
    ),
    thought('t-c2', 'action', 'GET https://news.ycombinator.com — 200 OK (1.2 s)', 'complete'),
    thought(
      't-c3',
      'result',
      'Extracted 30 story nodes from HTML; selecting the top 10 by rank.',
      'complete'
    ),
    thought(
      't-c4',
      'thought',
      'Summarizing each story title into a single sentence with context.',
      'complete'
    ),
  ],
  timestamp: new Date('2025-06-15T10:00:10Z'),
};

export const MOCK_AGENT_ERROR: AgentMessage = {
  id: 'mock-agent-error',
  role: 'agent',
  content: 'Error: Failed to fetch https://news.ycombinator.com — connection timed out after 30 s.',
  status: 'error',
  thoughts: [],
  timestamp: new Date('2025-06-15T10:00:05Z'),
};

// ── Full Conversation ────────────────────────────────────────────────────────

export const MOCK_FULL_CONVERSATION: Message[] = [
  MOCK_USER_MESSAGE,
  MOCK_AGENT_STREAMING_WITH_THOUGHTS,
  {
    id: 'mock-user-2',
    role: 'user',
    content: 'Great, now give me the full summary.',
    timestamp: new Date('2025-06-15T10:01:00Z'),
  } satisfies UserMessage,
  MOCK_AGENT_COMPLETE_WITH_THOUGHTS,
  {
    id: 'mock-user-3',
    role: 'user',
    content: 'Can you also fetch the comments for story #1?',
    timestamp: new Date('2025-06-15T10:02:00Z'),
  } satisfies UserMessage,
  MOCK_AGENT_ERROR,
];
