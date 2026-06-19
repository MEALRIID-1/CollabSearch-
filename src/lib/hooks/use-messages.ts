import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/lib/api/messages';
import type { SendMessageRequest } from '@/types/api';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const conversations = await messagesApi.getConversations();
      if (conversations === undefined) {
        console.error('messagesApi.getConversations returned undefined for key ["conversations"]');
        return [];
      }
      return conversations;
    },
  });
}

export function useConversation(userId: number) {
  return useQuery({
    queryKey: ['conversation', userId],
    queryFn: () => messagesApi.getConversation(userId),
    enabled: !!userId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.send(data),
    onSuccess: (_, { recipient_id }) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', recipient_id] });
    },
  });
}
