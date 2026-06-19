import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '@/lib/api/chat';
import type { CreateChatChannelRequest } from '@/types/api';

export function useChatChannels(projectId?: number) {
  return useQuery({
    queryKey: ['chat-channels', projectId],
    queryFn: () => chatApi.listChannels(projectId ? { project_id: projectId } : undefined),
  });
}

export function useChatChannel(channelId?: number) {
  return useQuery({
    queryKey: ['chat-channel', channelId],
    queryFn: () => (channelId ? chatApi.getChannel(channelId) : Promise.reject(new Error('Missing channelId'))),
    enabled: !!channelId,
  });
}

export function useCreateChatChannel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateChatChannelRequest) => chatApi.createChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
    },
  });
}
