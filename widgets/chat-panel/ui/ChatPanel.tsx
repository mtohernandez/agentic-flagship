'use client';

import { Card } from '@/components/ui/card';
import { MessageList } from '@/entities/message';
import type { Message } from '@/entities/message';
import { ThinkingIndicator } from '@/entities/agent';
import { MissionForm } from '@/features/run-mission';
import { ChatHeader } from './ChatHeader';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (prompt: string) => void;
  onClear: () => void;
}

export function ChatPanel({ messages, isLoading, onSendMessage, onClear }: ChatPanelProps) {
  return (
    <Card className="flex flex-col h-full">
      <ChatHeader messageCount={messages.length} onClear={onClear} />
      <MessageList messages={messages}>
        <ThinkingIndicator isThinking={isLoading} />
      </MessageList>
      <MissionForm onSubmit={onSendMessage} isLoading={isLoading} />
    </Card>
  );
}
