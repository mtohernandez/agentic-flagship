import { render, screen } from '@testing-library/react';
import { MessageList } from './MessageList';
import type { Message } from '../model/types';

vi.mock('./MessageBubble', () => ({
  MessageBubble: ({ message }: { message: Message }) => (
    <div data-testid={`message-${message.id}`}>{message.content}</div>
  ),
}));

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = vi.fn();

const makeMessage = (id: string, content: string): Message => ({
  id,
  role: 'user',
  content,
  timestamp: new Date('2025-01-15T12:00:00Z'),
});

describe('MessageList', () => {
  it('returns null when no messages', () => {
    const { container } = render(<MessageList messages={[]} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders a MessageBubble per message', () => {
    const messages = [makeMessage('1', 'Hello'), makeMessage('2', 'World')];
    render(<MessageList messages={messages} />);

    expect(screen.getByTestId('message-1')).toBeInTheDocument();
    expect(screen.getByTestId('message-2')).toBeInTheDocument();
  });

  it('renders children slot', () => {
    const messages = [makeMessage('1', 'Hello')];
    render(
      <MessageList messages={messages}>
        <div data-testid="child-slot">Child content</div>
      </MessageList>
    );

    expect(screen.getByTestId('child-slot')).toBeInTheDocument();
  });
});
