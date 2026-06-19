'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Loader2, Smile } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQueryClient } from '@tanstack/react-query';
import { useAddChatReaction, useChatMessages, useRemoveChatReaction, useSendChatMessage } from '@/lib/hooks/use-chat-messages';
import { getEcho } from '@/lib/echo';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { ChatMessage } from '@/types/models';

interface ConversationPanelProps {
  channelId: number;
}

export function ConversationPanel({ channelId }: ConversationPanelProps) {
  const { user: currentUser } = useAuthStore();
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { data, isLoading } = useChatMessages(channelId);
  const sendMessage = useSendChatMessage(channelId);
  const addReaction = useAddChatReaction(channelId);
  const removeReaction = useRemoveChatReaction(channelId);

  const messages = useMemo(() => (Array.isArray(data?.data) ? data.data : []), [data]);
  const recipient = messages.length > 0 ? messages[messages.length - 1].sender : null;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  useEffect(() => {
    const echo = getEcho();
    if (!echo) {
      return;
    }

    const channel = echo.private(`chat.${channelId}`);
    const refreshMessages = () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    };

    channel.listen('MessageSent', refreshMessages);
    channel.listen('ReactionAdded', refreshMessages);
    channel.listen('MessageEdited', refreshMessages);
    channel.listen('MessageDeleted', refreshMessages);

    return () => {
      channel.stopListening('MessageSent');
      channel.stopListening('ReactionAdded');
      channel.stopListening('MessageEdited');
      channel.stopListening('MessageDeleted');
      echo.leave(`chat.${channelId}`);
    };
  }, [channelId, queryClient]);

  const handleSend = async () => {
    if (!body.trim()) return;

    await sendMessage.mutateAsync({ body: body.trim(), type: 'text' });
    setBody('');
  };

  const handleAddReaction = async (message: ChatMessage, emoji: string) => {
    await addReaction.mutateAsync({ messageId: message.id, emoji });
  };

  const handleRemoveReaction = async (message: ChatMessage, emoji: string) => {
    await removeReaction.mutateAsync({ messageId: message.id, emoji });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Discussion</p>
          <p className="text-xs text-muted-foreground">Messages en temps réel et notifications de canal.</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-muted p-10 text-center text-sm text-muted-foreground">
            Aucun message dans ce canal. Soyez le premier à écrire.
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              message={message}
              isMine={message.sender_id === currentUser?.id}
              onReact={(emoji) => handleAddReaction(message, emoji)}
              onRemoveReaction={(emoji) => handleRemoveReaction(message, emoji)}
            />
          ))
        )}
      </div>

      <div className="border-t px-4 py-3">
        <div className="flex items-center gap-2">
          <Input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Écrire un message..."
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void handleSend();
              }
            }}
          />
          <Button
            variant="secondary"
            onClick={handleSend}
            disabled={!body.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Smile className="h-4 w-4" />
          Réactions rapides : cliquez sur 👍 pour répondre.
        </div>
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  isMine,
  onReact,
  onRemoveReaction,
}: {
  message: ChatMessage;
  isMine: boolean;
  onReact: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] rounded-3xl p-4 shadow-sm ${isMine ? 'bg-primary text-white' : 'bg-slate-100 text-slate-900'}`}>
        <div className="flex items-center gap-3 mb-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.sender.avatar ?? undefined} alt={message.sender.full_name} />
            <AvatarFallback>{message.sender.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{message.sender.full_name}</p>
            <p className="text-[11px] text-muted-foreground">{new Date(message.created_at).toLocaleTimeString()}</p>
          </div>
        </div>

        {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}

        {message.reactions && message.reactions.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {message.reactions.map((reaction) => (
              <Badge
                key={reaction.id}
                className="cursor-pointer bg-white text-slate-900 shadow-sm"
                onClick={() => onRemoveReaction(reaction.emoji)}
              >
                {reaction.emoji} {reaction.user.full_name.split(' ')[0]}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="icon" onClick={() => onReact('👍')}>
            <span className="text-base">👍</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onReact('❤️')}>
            <span className="text-base">❤️</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
