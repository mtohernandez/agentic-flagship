import { render, screen } from '@testing-library/react';
import { ChatPanel } from './ChatPanel';
import type { Message } from '@/entities/message';

vi.mock('./ChatHeader', () => ({
  ChatHeader: ({ messageCount, onClear }: { messageCount: number; onClear: () => void }) => (
    <div data-testid="chat-header" data-count={messageCount} onClick={onClear} />
  ),
}));

vi.mock('@/entities/message', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/message')>();
  return {
    ...actual,
    MessageList: ({ messages, children }: { messages: Message[]; children?: React.ReactNode }) => (
      <div data-testid="message-list" data-count={messages.length}>
        {children}
      </div>
    ),
  };
});

vi.mock('@/entities/agent', () => ({
  ThinkingIndicator: ({ isThinking }: { isThinking: boolean }) => (
    <div data-testid="thinking-indicator" data-thinking={isThinking} />
  ),
}));

vi.mock('@/features/run-mission', () => ({
  MissionForm: ({ onSubmit, isLoading }: { onSubmit: (p: string) => void; isLoading: boolean }) => (
    <div data-testid="mission-form" data-loading={isLoading} onClick={() => onSubmit('test')} />
  ),
}));

const defaultProps = {
  messages: [] as Message[],
  isLoading: false,
  onSendMessage: vi.fn(),
  onClear: vi.fn(),
};

describe('ChatPanel', () => {
  it('renders all child components', () => {
    render(<ChatPanel {...defaultProps} />);

    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByTestId('thinking-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('mission-form')).toBeInTheDocument();
  });

  it('passes correct props down to children', () => {
    const messages: Message[] = [{ id: '1', role: 'user', content: 'Hi', timestamp: new Date() }];
    render(
      <ChatPanel messages={messages} isLoading={true} onSendMessage={vi.fn()} onClear={vi.fn()} />
    );

    expect(screen.getByTestId('chat-header')).toHaveAttribute('data-count', '1');
    expect(screen.getByTestId('message-list')).toHaveAttribute('data-count', '1');
    expect(screen.getByTestId('thinking-indicator')).toHaveAttribute('data-thinking', 'true');
    expect(screen.getByTestId('mission-form')).toHaveAttribute('data-loading', 'true');
  });
});
