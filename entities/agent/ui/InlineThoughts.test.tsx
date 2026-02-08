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

vi.mock('@/components/ui/spinner', () => ({
  Spinner: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-spinner" className={props.className as string} />
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
  it('shows thinking fallback for empty thoughts during streaming', () => {
    render(<InlineThoughts thoughts={[]} isComplete={false} />);

    expect(screen.getByText('Thinking...')).toBeInTheDocument();
    expect(screen.getByTestId('icon-spinner')).toBeInTheDocument();
  });

  it('returns null for empty thoughts when complete', () => {
    const { container } = render(<InlineThoughts thoughts={[]} isComplete={true} />);

    expect(container.innerHTML).toBe('');
  });

  it('shows "Completed in X steps" when isComplete is true', () => {
    const thoughts = [makeThought('1', 'First'), makeThought('2', 'Second')];
    render(<InlineThoughts thoughts={thoughts} isComplete={true} />);

    expect(screen.getByText('Completed in 2 steps')).toBeInTheDocument();
  });

  it('uses singular "step" for 1 thought', () => {
    const thoughts = [makeThought('1', 'Only one')];
    render(<InlineThoughts thoughts={thoughts} isComplete={true} />);

    expect(screen.getByText('Completed in 1 step')).toBeInTheDocument();
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

  it('renders only active thought during streaming', () => {
    const thoughts = [makeThought('1', 'First'), makeThought('2', 'Second')];
    render(<InlineThoughts thoughts={thoughts} isComplete={false} activeThoughtId="2" />);

    expect(screen.queryByTestId('thought-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('thought-2')).toBeInTheDocument();
  });

  it('falls back to latest thought during streaming when no activeThoughtId matches', () => {
    const thoughts = [makeThought('1', 'First')];
    render(<InlineThoughts thoughts={thoughts} isComplete={false} activeThoughtId="nonexistent" />);

    expect(screen.getByTestId('thought-1')).toBeInTheDocument();
  });

  it('falls back to latest thought during streaming when activeThoughtId is undefined', () => {
    const thoughts = [makeThought('1', 'First')];
    render(<InlineThoughts thoughts={thoughts} isComplete={false} />);

    expect(screen.getByTestId('thought-1')).toBeInTheDocument();
  });
});
