'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { Message } from '../model/types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  children?: React.ReactNode;
}

export function MessageList({ messages, children }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className={cn('flex-1 p-4 pt-16 pb-52 space-y-4')}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {children}
      <div ref={bottomRef} />
    </div>
  );
}
