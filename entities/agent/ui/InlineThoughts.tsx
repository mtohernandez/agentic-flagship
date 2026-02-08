'use client';

import { useState } from 'react';
import { RiArrowRightSLine, RiArrowDownSLine } from '@remixicon/react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { useTranslation } from '@/shared/i18n';
import type { AgentThought } from '../model/types';
import { ThoughtItem } from './ThoughtItem';

interface InlineThoughtsProps {
  thoughts: AgentThought[];
  isComplete: boolean;
  activeThoughtId?: string;
}

export function InlineThoughts({ thoughts, isComplete, activeThoughtId }: InlineThoughtsProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isComplete) {
    const activeThought = thoughts.find((t) => t.id === activeThoughtId);
    const displayThought = activeThought ?? thoughts[thoughts.length - 1];

    const isWaiting = !displayThought || displayThought.status === 'complete';

    return (
      <div className="space-y-1.5 transition-all duration-300 ease-in-out">
        {displayThought && (
          <div
            key={displayThought.id}
            className="animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            <ThoughtItem thought={displayThought} />
          </div>
        )}
        {isWaiting && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in duration-300">
            <Spinner className="h-3 w-3" />
            <span>{displayThought ? t('agent', 'stillWorking') : t('agent', 'thinking')}</span>
          </div>
        )}
      </div>
    );
  }

  if (thoughts.length === 0) {
    return null;
  }

  const headerText = t('agent', 'completedSteps', { count: thoughts.length });

  return (
    <div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-1 h-7 px-0 text-xs text-muted-foreground hover:text-foreground"
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
        <div className="pt-2">
          <Separator className="mb-2" />
          <div className="space-y-1.5">
            {thoughts.map((thought) => (
              <ThoughtItem key={thought.id} thought={thought} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
