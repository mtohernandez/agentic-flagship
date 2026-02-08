'use client';

import { MessageList } from '@/entities/message';
import type { Message } from '@/entities/message';
import { MissionForm } from '@/features/run-mission';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (prompt: string) => void;
  onClear: () => void;
}

export function ChatPanel({ messages, isLoading, onSendMessage, onClear }: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MissionForm
        onSubmit={onSendMessage}
        isLoading={isLoading}
        messageCount={messages.length}
        onClear={onClear}
      />
    </div>
  );
}
