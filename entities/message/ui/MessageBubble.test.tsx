import { render, screen } from '@testing-library/react';
import { MessageBubble } from './MessageBubble';
import type { UserMessage, AgentMessage } from '../model/types';

vi.mock('@/entities/agent', () => ({
  InlineThoughts: ({
    thoughts,
    isComplete,
    activeThoughtId,
  }: {
    thoughts: unknown[];
    isComplete: boolean;
    activeThoughtId?: string;
  }) => (
    <div
      data-testid="inline-thoughts"
      data-complete={isComplete}
      data-active-thought-id={activeThoughtId ?? ''}
    >
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
  it('right-aligns user messages', () => {
    const { container } = render(<MessageBubble message={makeUserMessage('Hello')} />);

    expect(container.firstElementChild).toHaveClass('items-end');
  });

  it('left-aligns agent messages', () => {
    const { container } = render(<MessageBubble message={makeAgentMessage()} />);

    expect(container.firstElementChild).toHaveClass('items-start');
  });

  it('renders user message content text', () => {
    render(<MessageBubble message={makeUserMessage('Hello world')} />);

    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('hides content div when content is empty', () => {
    render(<MessageBubble message={makeAgentMessage({ content: '' })} />);

    expect(screen.queryByText('Generating response...')).not.toBeInTheDocument();
  });

  it('renders InlineThoughts inside card for agent messages', () => {
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

  it('renders InlineThoughts for agent messages even with empty thoughts', () => {
    render(<MessageBubble message={makeAgentMessage({ thoughts: [] })} />);

    expect(screen.getByTestId('inline-thoughts')).toBeInTheDocument();
  });

  it('does not render InlineThoughts for user messages', () => {
    render(<MessageBubble message={makeUserMessage('Hello')} />);

    expect(screen.queryByTestId('inline-thoughts')).not.toBeInTheDocument();
  });

  it('passes activeThoughtId to InlineThoughts', () => {
    const thoughts = [
      {
        id: 't1',
        type: 'thought' as const,
        content: 'Thinking',
        status: 'executing' as const,
        timestamp: new Date(),
      },
    ];
    render(
      <MessageBubble
        message={makeAgentMessage({ thoughts, activeThoughtId: 't1', status: 'streaming' })}
      />
    );

    const inlineThoughts = screen.getByTestId('inline-thoughts');
    expect(inlineThoughts).toHaveAttribute('data-active-thought-id', 't1');
  });
});
