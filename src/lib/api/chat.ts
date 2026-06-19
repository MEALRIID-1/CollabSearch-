import apiClient from './client';
import type { ChatChannel, ChatMessage } from '@/types/models';
import type { AddChatReactionRequest, CreateChatChannelRequest, PaginatedResponse, SendChatMessageRequest } from '@/types/api';

export const chatApi = {
  async listChannels(params?: { project_id?: number }): Promise<ChatChannel[]> {
    const response = await apiClient.get<{ channels?: ChatChannel[]; data?: ChatChannel[] }>('/api/v1/chat-channels', { params });
    const payload = response.data;
    return payload.channels ?? payload.data ?? [];
  },

  async getChannel(channelId: number): Promise<ChatChannel> {
    const response = await apiClient.get<{ channel: ChatChannel }>(`/api/v1/chat-channels/${channelId}`);
    return response.data.channel;
  },

  async getChannelMessages(channelId: number, params?: { per_page?: number; cursor?: string }): Promise<PaginatedResponse<ChatMessage> | { data: ChatMessage[] }> {
    const response = await apiClient.get<{ messages?: ChatMessage[]; data?: ChatMessage[] }>(`/api/v1/chat-channels/${channelId}/messages`, { params });
    const payload = response.data;
    if (Array.isArray(payload.messages)) {
      return { data: payload.messages };
    }
    return { data: payload.data ?? [] };
  },

  async sendMessage(channelId: number, data: SendChatMessageRequest): Promise<ChatMessage> {
    const response = await apiClient.post<{ data: ChatMessage }>(`/api/v1/chat-channels/${channelId}/messages`, data);
    return response.data.data;
  },

  async createChannel(data: CreateChatChannelRequest): Promise<ChatChannel> {
    const response = await apiClient.post<{ channel: ChatChannel }>('/api/v1/chat-channels', data);
    return response.data.channel;
  },

  async addReaction(channelId: number, messageId: number, data: AddChatReactionRequest): Promise<void> {
    await apiClient.post(`/api/v1/chat-channels/${channelId}/messages/${messageId}/reactions`, data);
  },

  async removeReaction(channelId: number, messageId: number, emoji: string): Promise<void> {
    await apiClient.delete(`/api/v1/chat-channels/${channelId}/messages/${messageId}/reactions`, {
      params: { emoji },
    });
  },
};
