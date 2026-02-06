'use client';

import { Badge } from '@/components/ui/badge';

interface ThinkingIndicatorProps {
  isThinking: boolean;
}

export function ThinkingIndicator({ isThinking }: ThinkingIndicatorProps) {
  if (!isThinking) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="animate-pulse">
        <span className="mr-1">●</span>
        Agent is thinking...
      </Badge>
    </div>
  );
}
