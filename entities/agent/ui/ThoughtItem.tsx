'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib';
import { RiCheckLine, RiLoader4Line } from '@remixicon/react';
import type { AgentThought } from '../model/types';

interface ThoughtItemProps {
  thought: AgentThought;
}

const typeStyles: Record<string, { variant: 'default' | 'secondary' | 'outline'; label: string }> =
  {
    thought: { variant: 'secondary', label: 'Thought' },
    action: { variant: 'default', label: 'Action' },
    result: { variant: 'outline', label: 'Result' },
  };

export function ThoughtItem({ thought }: ThoughtItemProps) {
  const style = typeStyles[thought.type] || typeStyles.thought;
  const isExecuting = thought.status === 'executing';
  const isComplete = thought.status === 'complete';

  return (
    <div className={cn('flex items-start gap-2 text-sm')}>
      <div className="flex items-center gap-1.5 shrink-0">
        {isComplete && <RiCheckLine className="h-3 w-3 text-green-500" />}
        {isExecuting && <RiLoader4Line className="h-3 w-3 animate-spin text-primary" />}
        {!isComplete && !isExecuting && <div className="h-3 w-3" />}
        <Badge variant={style.variant} className={cn('text-xs', isExecuting && 'animate-pulse')}>
          {style.label}
        </Badge>
      </div>
      <span className="text-muted-foreground whitespace-pre-wrap wrap-break-word">
        {thought.content}
      </span>
    </div>
  );
}
