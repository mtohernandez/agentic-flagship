'use client';

import { RiCheckLine } from '@remixicon/react';
import { Spinner } from '@/components/ui/spinner';
import type { AgentThought } from '../model/types';

interface ThoughtItemProps {
  thought: AgentThought;
}

export function ThoughtItem({ thought }: ThoughtItemProps) {
  const isExecuting = thought.status === 'executing';
  const isComplete = thought.status === 'complete';

  return (
    <div className="flex items-center gap-2 text-sm animate-in fade-in duration-300">
      <div className="shrink-0 transition-all duration-300">
        {isComplete && <RiCheckLine className="h-3 w-3 text-green-500" />}
        {isExecuting && <Spinner className="h-3 w-3 text-primary" />}
        {!isComplete && !isExecuting && <div className="h-3 w-3" />}
      </div>
      <span className="text-muted-foreground whitespace-pre-wrap wrap-break-word">
        {thought.content}
      </span>
    </div>
  );
}
