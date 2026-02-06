'use client';

import { useEffect, useRef } from 'react';
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

  return (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Start a conversation by typing a message below
        </div>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
      {children}
      <div ref={bottomRef} />
    </div>
  );
}
