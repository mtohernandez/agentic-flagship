import { render, screen, fireEvent } from '@testing-library/react';
import { InlineThoughts } from './InlineThoughts';
import type { AgentThought } from '../model/types';

vi.mock('./ThoughtItem', () => ({
  ThoughtItem: ({ thought }: { thought: AgentThought }) => (
    <div data-testid={`thought-${thought.id}`}>{thought.content}</div>
  ),
}));

vi.mock('@remixicon/react', () => ({
  RiArrowRightSLine: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-arrow-right" className={props.className as string} />
  ),
  RiArrowDownSLine: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-arrow-down" className={props.className as string} />
  ),
}));

const makeThought = (id: string, content: string): AgentThought => ({
  id,
  type: 'thought',
  content,
  status: 'complete',
  timestamp: new Date('2025-01-15T12:00:00Z'),
});

describe('InlineThoughts', () => {
  it('returns null for empty thoughts array', () => {
    const { container } = render(<InlineThoughts thoughts={[]} isComplete={false} />);

    expect(container.innerHTML).toBe('');
  });

  it('shows "Completed in X steps" when isComplete is true', () => {
    const thoughts = [makeThought('1', 'First'), makeThought('2', 'Second')];
    render(<InlineThoughts thoughts={thoughts} isComplete={true} />);

    expect(screen.getByText('Completed in 2 steps')).toBeInTheDocument();
  });

  it('shows "Thinking (X steps)" when isComplete is false', () => {
    const thoughts = [makeThought('1', 'First'), makeThought('2', 'Second')];
    render(<InlineThoughts thoughts={thoughts} isComplete={false} />);

    expect(screen.getByText('Thinking (2 steps)')).toBeInTheDocument();
  });

  it('uses singular "step" for 1 thought', () => {
    const thoughts = [makeThought('1', 'Only one')];
    render(<InlineThoughts thoughts={thoughts} isComplete={true} />);

    expect(screen.getByText('Completed in 1 step')).toBeInTheDocument();
  });

  it('starts expanded when not complete', () => {
    const thoughts = [makeThought('1', 'First')];
    render(<InlineThoughts thoughts={thoughts} isComplete={false} />);

    expect(screen.getByTestId('thought-1')).toBeInTheDocument();
  });

  it('starts collapsed when complete', () => {
    const thoughts = [makeThought('1', 'First')];
    render(<InlineThoughts thoughts={thoughts} isComplete={true} />);

    expect(screen.queryByTestId('thought-1')).not.toBeInTheDocument();
  });

  it('toggles expand/collapse on button click', () => {
    const thoughts = [makeThought('1', 'First')];
    render(<InlineThoughts thoughts={thoughts} isComplete={true} />);

    // Initially collapsed
    expect(screen.queryByTestId('thought-1')).not.toBeInTheDocument();

    // Click to expand
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('thought-1')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByTestId('thought-1')).not.toBeInTheDocument();
  });
});
