'use client';

import { useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import {
  InputGroup,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
} from '@/components/ui/input-group';

interface MissionFormProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
}

export function MissionForm({ onSubmit, isLoading = false }: MissionFormProps) {
  const [input, setInput] = useState('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      onSubmit(input.trim());
      setInput('');
    },
    [input, isLoading, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        onSubmit(input.trim());
        setInput('');
      }
    },
    [input, isLoading, onSubmit]
  );

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border">
      <InputGroup className="h-auto">
        <InputGroupTextarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          rows={2}
          disabled={isLoading}
          className="min-h-[60px]"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            type="submit"
            disabled={isLoading || !input.trim()}
            size="sm"
            variant="default"
          >
            {isLoading ? <span className="animate-spin">⟳</span> : 'Send'}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
