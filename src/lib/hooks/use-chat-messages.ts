import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';
import type { SendChatMessageRequest, AddChatReactionRequest } from '@/types/api';

export function useChatMessages(channelId?: number) {
  return useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: () => (channelId ? chatApi.getChannelMessages(channelId) : Promise.reject(new Error('Missing channelId'))),
    enabled: !!channelId,
  });
}

export function useSendChatMessage(channelId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SendChatMessageRequest) => chatApi.sendMessage(channelId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
  });
}

export function useAddChatReaction(channelId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) => chatApi.addReaction(channelId, messageId, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    },
  });
}

export function useRemoveChatReaction(channelId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: number; emoji: string }) => chatApi.removeReaction(channelId, messageId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', channelId] });
    },
  });
}
