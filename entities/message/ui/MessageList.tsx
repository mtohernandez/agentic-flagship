'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Message } from '../model/types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  children?: React.ReactNode;
}

export function MessageList({ messages, children }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div
      className={cn(
        'flex-1 p-4 pb-52',
        hasMessages ? 'overflow-y-auto space-y-4' : 'overflow-hidden'
      )}
    >
      {!hasMessages ? (
        <div className="flex flex-col items-center justify-center h-full gap-6 max-w-sm mx-auto text-center">
          <Image
            src="/agentic-logo.svg"
            alt="Agentic"
            width={48}
            height={48}
            className="h-12 w-12 opacity-80 dark:invert-0 invert"
            priority
          />
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Welcome to Agentic</h2>
            <p className="text-sm text-muted-foreground">
              Your AI-powered web scraping assistant. Paste a URL, pick an action, and let the agent
              do the work.
            </p>
          </div>
        </div>
      ) : (
        messages.map((message) => <MessageBubble key={message.id} message={message} />)
      )}
      {children}
      <div ref={bottomRef} />
    </div>
  );
}
