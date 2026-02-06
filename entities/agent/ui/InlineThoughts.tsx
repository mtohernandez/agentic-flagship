'use client';

import { useState } from 'react';
import { RiArrowRightSLine, RiArrowDownSLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { AgentThought } from '../model/types';
import { ThoughtItem } from './ThoughtItem';

interface InlineThoughtsProps {
  thoughts: AgentThought[];
  isComplete: boolean;
}

export function InlineThoughts({ thoughts, isComplete }: InlineThoughtsProps) {
  // Start collapsed if already complete, otherwise start expanded
  const [isExpanded, setIsExpanded] = useState(() => !isComplete);

  if (thoughts.length === 0) {
    return null;
  }

  const headerText = isComplete
    ? `Completed in ${thoughts.length} step${thoughts.length !== 1 ? 's' : ''}`
    : `Thinking (${thoughts.length} step${thoughts.length !== 1 ? 's' : ''})`;

  return (
    <div className="mt-2 border rounded-md bg-background/50">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-1 h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <RiArrowDownSLine className="h-3 w-3" />
        ) : (
          <RiArrowRightSLine className="h-3 w-3" />
        )}
        {headerText}
      </Button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <Separator className="mb-3" />
          <div className="space-y-2">
            {thoughts.map((thought) => (
              <ThoughtItem key={thought.id} thought={thought} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
