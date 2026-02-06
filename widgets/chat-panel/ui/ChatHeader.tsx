'use client';

import { CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ChatHeaderProps {
  messageCount: number;
  onClear: () => void;
}

export function ChatHeader({ messageCount, onClear }: ChatHeaderProps) {
  return (
    <CardHeader className="border-b">
      <CardTitle className="flex items-center gap-2">
        Chat
        {messageCount > 0 && <Badge variant="secondary">{messageCount}</Badge>}
      </CardTitle>
      <CardAction>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={messageCount === 0}>
          Clear
        </Button>
      </CardAction>
    </CardHeader>
  );
}
