import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import type { UserMessage, AgentMessage } from '../model/types';

vi.mock('@/entities/agent', () => ({
  InlineThoughts: ({ thoughts, isComplete }: { thoughts: unknown[]; isComplete: boolean }) => (
    <div data-testid="inline-thoughts" data-complete={isComplete}>
      {thoughts.length} thoughts
    </div>
  ),
}));

const makeUserMessage = (content: string): UserMessage => ({
  id: 'msg-1',
  role: 'user',
  content,
  timestamp: new Date('2025-01-15T12:00:00Z'),
});

const makeAgentMessage = (overrides: Partial<AgentMessage> = {}): AgentMessage => ({
  id: 'msg-2',
  role: 'agent',
  content: 'Agent response',
  status: 'complete',
  thoughts: [],
  timestamp: new Date('2025-01-15T12:00:00Z'),
  ...overrides,
});

describe('MessageBubble', () => {
  it('shows "You" badge for user messages', () => {
    render(<MessageBubble message={makeUserMessage('Hello')} />);

    expect(screen.getByText('You')).toBeInTheDocument();
  });

  it('right-aligns user messages', () => {
    const { container } = render(<MessageBubble message={makeUserMessage('Hello')} />);

    expect(container.firstElementChild).toHaveClass('justify-end');
  });

  it('shows "Agent" badge for agent messages', () => {
    render(<MessageBubble message={makeAgentMessage()} />);

    expect(screen.getByText('Agent')).toBeInTheDocument();
  });

  it('left-aligns agent messages', () => {
    const { container } = render(<MessageBubble message={makeAgentMessage()} />);

    expect(container.firstElementChild).toHaveClass('justify-start');
  });

  it('renders user message content text', () => {
    render(<MessageBubble message={makeUserMessage('Hello world')} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('shows "Generating response..." placeholder when content is empty', () => {
    render(<MessageBubble message={makeAgentMessage({ content: '' })} />);

    expect(screen.getByText('Generating response...')).toBeInTheDocument();
  });

  it('renders InlineThoughts when agent message has thoughts', () => {
    const thoughts = [
      {
        id: 't1',
        type: 'thought' as const,
        content: 'Thinking',
        status: 'complete' as const,
        timestamp: new Date(),
      },
    ];
    render(<MessageBubble message={makeAgentMessage({ thoughts })} />);

    expect(screen.getByTestId('inline-thoughts')).toBeInTheDocument();
  });

  it('does not render InlineThoughts when thoughts array is empty', () => {
    render(<MessageBubble message={makeAgentMessage({ thoughts: [] })} />);

    expect(screen.queryByTestId('inline-thoughts')).not.toBeInTheDocument();
  });
});
