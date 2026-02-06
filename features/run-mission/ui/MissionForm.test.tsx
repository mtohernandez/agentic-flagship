import { render, screen, fireEvent } from '@testing-library/react';
import { MissionForm } from './MissionForm';

describe('MissionForm', () => {
  it('renders textarea and submit button', () => {
    render(<MissionForm onSubmit={vi.fn()} />);

    expect(screen.getByPlaceholderText(/Type a message/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('submits trimmed input on form submit', () => {
    const onSubmit = vi.fn();
    render(<MissionForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/Type a message/);
    fireEvent.change(textarea, { target: { value: '  Hello world  ' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Send' }).closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith('Hello world');
  });

  it('submits on Enter key (no Shift)', () => {
    const onSubmit = vi.fn();
    render(<MissionForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/Type a message/);
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSubmit).toHaveBeenCalledWith('Test');
  });

  it('does NOT submit on Shift+Enter', () => {
    const onSubmit = vi.fn();
    render(<MissionForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/Type a message/);
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears input after submission', () => {
    render(<MissionForm onSubmit={vi.fn()} />);

    const textarea = screen.getByPlaceholderText(/Type a message/) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Test' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(textarea.value).toBe('');
  });

  it('rejects empty/whitespace-only input', () => {
    const onSubmit = vi.fn();
    render(<MissionForm onSubmit={onSubmit} />);

    const textarea = screen.getByPlaceholderText(/Type a message/);
    fireEvent.change(textarea, { target: { value: '   ' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables textarea and button when isLoading is true', () => {
    render(<MissionForm onSubmit={vi.fn()} isLoading={true} />);

    expect(screen.getByPlaceholderText(/Type a message/)).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows spinner when loading and hides "Send"', () => {
    render(<MissionForm onSubmit={vi.fn()} isLoading={true} />);

    expect(screen.getByText('⟳')).toBeInTheDocument();
    expect(screen.queryByText('Send')).not.toBeInTheDocument();
  });
});
