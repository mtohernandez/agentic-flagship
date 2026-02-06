import { render, screen } from '@testing-library/react';
import { ThinkingIndicator } from './ThinkingIndicator';

describe('ThinkingIndicator', () => {
  it('renders nothing when isThinking is false', () => {
    const { container } = render(<ThinkingIndicator isThinking={false} />);

    expect(container.innerHTML).toBe('');
  });

  it('renders "Agent is thinking..." when isThinking is true', () => {
    render(<ThinkingIndicator isThinking={true} />);

    expect(screen.getByText('Agent is thinking...')).toBeInTheDocument();
  });
});
