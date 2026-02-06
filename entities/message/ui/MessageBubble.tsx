'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/lib';
import { InlineThoughts } from '@/entities/agent';
import type { Message } from '../model/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <Card
        className={cn('max-w-[80%]', isUser ? 'bg-primary text-primary-foreground' : 'bg-muted')}
      >
        <CardContent className="py-2">
          <div className="flex items-start gap-2">
            <Badge variant={isUser ? 'secondary' : 'outline'} className="shrink-0 text-xs">
              {isUser ? 'You' : 'Agent'}
            </Badge>
            <div className="flex-1 whitespace-pre-wrap wrap-break-word text-sm">
              {message.content || (
                <span className="text-muted-foreground italic">Generating response...</span>
              )}
            </div>
          </div>
          {isAgent && message.thoughts.length > 0 && (
            <InlineThoughts
              thoughts={message.thoughts}
              isComplete={message.status === 'complete'}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
