'use client';

import { RiUser4Line, RiRobot2Line, RiCloseCircleLine } from '@remixicon/react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/shared/lib';
import { InlineThoughts } from '@/entities/agent';
import type { Message } from '../model/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isAgent = message.role === 'agent';
  const isError = isAgent && message.status === 'error';

  return (
    <div
      className={cn(
        'flex flex-col animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div className={cn('flex items-center gap-1 mb-1', isUser && 'flex-row-reverse')}>
        {isUser ? (
          <RiUser4Line className="h-3 w-3 text-muted-foreground" />
        ) : (
          <RiRobot2Line className="h-3 w-3 text-muted-foreground" />
        )}
        <span className="text-[11px] font-medium text-muted-foreground">
          {isUser ? 'You' : 'Agent'}
        </span>
      </div>
      <Card
        className={cn(
          'max-w-[80%] py-2',
          isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
        )}
      >
        <CardContent className="py-2 space-y-2">
          {isAgent && !isError && (
            <InlineThoughts
              thoughts={message.thoughts}
              isComplete={message.status === 'complete'}
              activeThoughtId={message.activeThoughtId}
            />
          )}
          {isError && (
            <div className="flex items-start gap-2">
              <RiCloseCircleLine className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <span className="text-sm text-destructive">
                {message.content || 'An unexpected error occurred.'}
              </span>
            </div>
          )}
          {message.content && !isError && (!isAgent || message.status === 'complete') && (
            <div className="whitespace-pre-wrap wrap-break-word text-sm">{message.content}</div>
          )}
        </CardContent>
      </Card>
      <span
        className={cn(
          'mt-1 text-[10px] text-muted-foreground',
          isUser ? 'text-right' : 'text-left'
        )}
      >
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}
