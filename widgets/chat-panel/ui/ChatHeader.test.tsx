import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from './ChatHeader';

describe('ChatHeader', () => {
  it('shows "Chat" title always', () => {
    render(<ChatHeader messageCount={0} onClear={vi.fn()} />);

    expect(screen.getByText('Chat')).toBeInTheDocument();
  });

  it('shows message count badge when count > 0', () => {
    render(<ChatHeader messageCount={5} onClear={vi.fn()} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('hides badge when count is 0', () => {
    render(<ChatHeader messageCount={0} onClear={vi.fn()} />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('calls onClear on click', () => {
    const onClear = vi.fn();
    render(<ChatHeader messageCount={3} onClear={onClear} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('disables clear button when count is 0', () => {
    render(<ChatHeader messageCount={0} onClear={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
  });
});
