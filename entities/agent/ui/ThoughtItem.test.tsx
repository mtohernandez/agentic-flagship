import { render, screen } from '@testing-library/react';
import { ThoughtItem } from './ThoughtItem';
import type { AgentThought } from '../model/types';

vi.mock('@remixicon/react', () => ({
  RiCheckLine: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-check" className={props.className as string} />
  ),
  RiLoader4Line: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-loader" className={props.className as string} />
  ),
}));

const makeThought = (overrides: Partial<AgentThought> = {}): AgentThought => ({
  id: 'thought-1',
  type: 'thought',
  content: 'Test thought content',
  status: 'pending',
  timestamp: new Date('2025-01-15T12:00:00Z'),
  ...overrides,
});

describe('ThoughtItem', () => {
  it('renders thought content text', () => {
    render(<ThoughtItem thought={makeThought({ content: 'Analyzing data...' })} />);

    expect(screen.getByText('Analyzing data...')).toBeInTheDocument();
  });

  it('shows green check icon when status is complete', () => {
    render(<ThoughtItem thought={makeThought({ status: 'complete' })} />);

    const icon = screen.getByTestId('icon-check');
    expect(icon).toBeInTheDocument();
    expect(icon.className).toContain('text-green-500');
  });

  it('shows spinning loader when status is executing', () => {
    render(<ThoughtItem thought={makeThought({ status: 'executing' })} />);

    const icon = screen.getByTestId('icon-loader');
    expect(icon).toBeInTheDocument();
    expect(icon.className).toContain('animate-spin');
  });

  it('shows no icon when status is pending', () => {
    render(<ThoughtItem thought={makeThought({ status: 'pending' })} />);

    expect(screen.queryByTestId('icon-check')).not.toBeInTheDocument();
    expect(screen.queryByTestId('icon-loader')).not.toBeInTheDocument();
  });

  it('renders "Thought" badge for thought type', () => {
    render(<ThoughtItem thought={makeThought({ type: 'thought' })} />);

    expect(screen.getByText('Thought')).toBeInTheDocument();
  });

  it('renders "Action" badge for action type', () => {
    render(<ThoughtItem thought={makeThought({ type: 'action' })} />);

    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders "Result" badge for result type', () => {
    render(<ThoughtItem thought={makeThought({ type: 'result' })} />);

    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  it('falls back to "Thought" style for unknown type', () => {
    render(<ThoughtItem thought={makeThought({ type: 'unknown' as AgentThought['type'] })} />);

    expect(screen.getByText('Thought')).toBeInTheDocument();
  });
});
