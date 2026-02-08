import { render, screen, fireEvent } from '@testing-library/react';
import { MissionForm } from './MissionForm';

// Mock Radix Select to avoid portal/DOM complexity in jsdom
vi.mock('@/components/ui/select', () => {
  const SelectMock = ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    value?: string;
    onValueChange?: (v: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="select-root" data-value={props.value} data-disabled={props.disabled}>
      {children}
    </div>
  );
  const SelectTrigger = ({ children, ...props }: React.ComponentProps<'button'>) => (
    <button data-testid="select-trigger" {...props}>
      {children}
    </button>
  );
  const SelectValue = () => <span data-testid="select-value" />;
  const SelectContent = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
  const SelectItem = ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-testid={`select-item-${value}`}>{children}</div>
  );
  return { Select: SelectMock, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

vi.mock('@remixicon/react', () => ({
  RiCloseLine: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-close" {...props} />
  ),
  RiAddLine: (props: React.SVGProps<SVGSVGElement>) => <span data-testid="icon-add" {...props} />,
  RiArrowUpLine: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-arrow-up" {...props} />
  ),
  RiSettings3Line: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-settings" {...props} />
  ),
  RiLoader2Fill: (props: React.SVGProps<SVGSVGElement>) => (
    <span data-testid="icon-loader" role="status" aria-label="Loading" {...props} />
  ),
}));

const defaultProps = {
  onSubmit: vi.fn(),
  messageCount: 0,
  onClear: vi.fn(),
};

function addJob(url: string) {
  const input = screen.getByLabelText('URL input');
  fireEvent.change(input, { target: { value: url } });
  fireEvent.click(screen.getByLabelText('Add Job'));
}

function openInstructions() {
  fireEvent.click(screen.getByLabelText('Toggle instructions'));
}

describe('MissionForm', () => {
  describe('rendering', () => {
    it('renders URL input, Add Job button, action select, Run button, and settings toggle', () => {
      render(<MissionForm {...defaultProps} />);

      expect(screen.getByLabelText('URL input')).toBeInTheDocument();
      expect(screen.getByLabelText('Add Job')).toBeInTheDocument();
      expect(screen.getByTestId('select-trigger')).toBeInTheDocument();
      expect(screen.getByLabelText('Run')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle instructions')).toBeInTheDocument();
    });

    it('does not render Chat header', () => {
      render(<MissionForm {...defaultProps} />);

      expect(screen.queryByText('Chat')).not.toBeInTheDocument();
    });

    it('instructions textarea is hidden by default', () => {
      render(<MissionForm {...defaultProps} />);

      // Textarea is in the DOM but inside collapsed container
      const textarea = screen.getByLabelText('Additional instructions');
      expect(textarea).toBeInTheDocument();
      expect(textarea.closest('[class*="grid-rows-"]')).toHaveClass('grid-rows-[0fr]');
    });

    it('shows textarea when settings toggle is clicked', () => {
      render(<MissionForm {...defaultProps} />);

      openInstructions();

      const textarea = screen.getByLabelText('Additional instructions');
      expect(textarea.closest('[class*="grid-rows-"]')).toHaveClass('grid-rows-[1fr]');
    });
  });

  describe('header', () => {
    it('shows Clear button only when messageCount > 0', () => {
      render(<MissionForm {...defaultProps} messageCount={5} />);

      expect(screen.getByLabelText('Clear chat')).toBeInTheDocument();
    });

    it('hides Clear button when messageCount is 0', () => {
      render(<MissionForm {...defaultProps} messageCount={0} />);

      expect(screen.queryByLabelText('Clear chat')).not.toBeInTheDocument();
    });

    it('calls onClear when Clear button is clicked', () => {
      const onClear = vi.fn();
      render(<MissionForm {...defaultProps} messageCount={3} onClear={onClear} />);

      fireEvent.click(screen.getByLabelText('Clear chat'));

      expect(onClear).toHaveBeenCalledTimes(1);
    });

    it('disables Clear during processing', () => {
      render(<MissionForm {...defaultProps} messageCount={3} isLoading={true} />);

      expect(screen.getByLabelText('Clear chat')).toBeDisabled();
    });
  });

  describe('job management', () => {
    it('adds a job and shows mini-card with hostname and action', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('https://example.com/page');

      expect(screen.getByLabelText('Remove example.com Extract text content')).toBeInTheDocument();
      expect((screen.getByLabelText('URL input') as HTMLInputElement).value).toBe('');
    });

    it('shows error for invalid URL', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('not-a-url');

      expect(screen.getByText('URL must start with http:// or https://')).toBeInTheDocument();
    });

    it('shows error for duplicate job (same URL + action)', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('https://example.com');
      addJob('https://example.com');

      expect(screen.getByText('Job already added')).toBeInTheDocument();
    });

    it('clears URL error when user types', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('not-a-url');
      expect(screen.getByText('URL must start with http:// or https://')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('URL input'), { target: { value: 'h' } });
      expect(screen.queryByText('URL must start with http:// or https://')).not.toBeInTheDocument();
    });

    it('removes job when mini-card close button is clicked', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('https://example.com');
      expect(screen.getByText(/example\.com/)).toBeInTheDocument();

      fireEvent.click(screen.getByLabelText('Remove example.com Extract text content'));
      expect(screen.queryByText(/example\.com/)).not.toBeInTheDocument();
    });

    it('adds job on Enter key in URL input', () => {
      render(<MissionForm {...defaultProps} />);

      const input = screen.getByLabelText('URL input');
      fireEvent.change(input, { target: { value: 'https://example.com' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByText(/example\.com/)).toBeInTheDocument();
    });

    it('clears instructions after adding a job', () => {
      render(<MissionForm {...defaultProps} />);

      openInstructions();
      fireEvent.change(screen.getByLabelText('Additional instructions'), {
        target: { value: 'some text' },
      });
      addJob('https://example.com');

      expect((screen.getByLabelText('Additional instructions') as HTMLTextAreaElement).value).toBe(
        ''
      );
    });
  });

  describe('submission', () => {
    it('submits single job prompt on Run click', () => {
      const onSubmit = vi.fn();
      render(<MissionForm {...defaultProps} onSubmit={onSubmit} />);

      addJob('https://example.com');
      fireEvent.click(screen.getByLabelText('Run'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('https://example.com'));
    });

    it('shows "Run N jobs" in sr-only text when jobs exist', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('https://first.com');
      addJob('https://second.com');

      expect(screen.getByLabelText('Run')).toHaveTextContent('Run 2 jobs');
    });

    it('shows "Run 1 job" for single job', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('https://example.com');

      expect(screen.getByLabelText('Run')).toHaveTextContent('Run 1 job');
    });

    it('shows "Run" when no jobs', () => {
      render(<MissionForm {...defaultProps} />);

      expect(screen.getByLabelText('Run')).toHaveTextContent('Run');
    });

    it('resets form fields after submission', () => {
      render(<MissionForm {...defaultProps} />);

      addJob('https://example.com');
      fireEvent.click(screen.getByLabelText('Run'));

      expect(screen.queryByText(/example\.com/)).not.toBeInTheDocument();
    });

    it('disables Run when no jobs are added', () => {
      render(<MissionForm {...defaultProps} />);

      expect(screen.getByLabelText('Run')).toBeDisabled();
    });

    it('disables all inputs when isLoading is true', () => {
      render(<MissionForm {...defaultProps} isLoading={true} />);

      openInstructions();

      expect(screen.getByLabelText('URL input')).toBeDisabled();
      expect(screen.getByLabelText('Add Job')).toBeDisabled();
      expect(screen.getByLabelText('Additional instructions')).toBeDisabled();
      expect(screen.getByLabelText('Run')).toBeDisabled();
    });

    it('shows spinner on Run button when loading', () => {
      render(<MissionForm {...defaultProps} isLoading={true} />);

      const runButton = screen.getByLabelText('Run');
      expect(runButton.querySelector('[role="status"]')).toBeInTheDocument();
    });
  });

  describe('queue behavior', () => {
    it('sends first prompt immediately and queues the rest', () => {
      const onSubmit = vi.fn();
      render(<MissionForm {...defaultProps} onSubmit={onSubmit} />);

      addJob('https://first.com');
      addJob('https://second.com');
      addJob('https://third.com');
      fireEvent.click(screen.getByLabelText('Run'));

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith(expect.stringContaining('https://first.com'));
    });

    it('shows queue progress during processing', () => {
      const onSubmit = vi.fn();
      render(<MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={false} />);

      addJob('https://first.com');
      addJob('https://second.com');
      addJob('https://third.com');
      fireEvent.click(screen.getByLabelText('Run'));

      expect(screen.getByText(/Processing.*of.*3.*jobs/)).toBeInTheDocument();
    });

    it('auto-fires next prompt when isLoading goes true→false', () => {
      const onSubmit = vi.fn();
      const { rerender } = render(
        <MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={false} />
      );

      addJob('https://first.com');
      addJob('https://second.com');
      fireEvent.click(screen.getByLabelText('Run'));

      expect(onSubmit).toHaveBeenCalledTimes(1);

      // Simulate loading starts
      rerender(<MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={true} />);
      // Simulate loading completes
      rerender(<MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={false} />);

      expect(onSubmit).toHaveBeenCalledTimes(2);
      expect(onSubmit).toHaveBeenLastCalledWith(expect.stringContaining('https://second.com'));
    });

    it('cancels remaining queue on Cancel click', () => {
      const onSubmit = vi.fn();
      render(<MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={false} />);

      addJob('https://first.com');
      addJob('https://second.com');
      addJob('https://third.com');
      fireEvent.click(screen.getByLabelText('Run'));

      expect(screen.getByLabelText('Cancel queue')).toBeInTheDocument();
      fireEvent.click(screen.getByLabelText('Cancel queue'));

      expect(screen.queryByText(/Processing/)).not.toBeInTheDocument();
    });

    it('does not auto-fire after cancel even when isLoading toggles', () => {
      const onSubmit = vi.fn();
      const { rerender } = render(
        <MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={false} />
      );

      addJob('https://first.com');
      addJob('https://second.com');
      fireEvent.click(screen.getByLabelText('Run'));

      // Cancel the queue
      fireEvent.click(screen.getByLabelText('Cancel queue'));

      // Simulate loading cycle
      rerender(<MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={true} />);
      rerender(<MissionForm {...defaultProps} onSubmit={onSubmit} isLoading={false} />);

      // Only the first submit should have happened
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe('Enter key in URL input', () => {
    it('submits form on Enter with empty input but existing jobs', () => {
      const onSubmit = vi.fn();
      render(<MissionForm {...defaultProps} onSubmit={onSubmit} />);

      addJob('https://example.com');

      const input = screen.getByLabelText('URL input');
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('does not submit form on Enter with text in input', () => {
      const onSubmit = vi.fn();
      render(<MissionForm {...defaultProps} onSubmit={onSubmit} />);

      addJob('https://example.com');

      const input = screen.getByLabelText('URL input');
      fireEvent.change(input, { target: { value: 'https://other.com' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should add job, not submit
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByText(/other\.com/)).toBeInTheDocument();
    });
  });
});
