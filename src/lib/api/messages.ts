import apiClient from './client';
import type { Message, Conversation, User } from '@/types/models';
import type { SendMessageRequest, PaginatedResponse, PaginatedResponseWithConversation } from '@/types/api';

interface MessageConversationPayload {
  conversation_with?: User;
  messages?: {
    data?: Message[];
    meta?: PaginatedResponse<Message>['meta'];
    links?: PaginatedResponse<Message>['links'];
  } | Message[];
  data?: Message[];
  meta?: PaginatedResponse<Message>['meta'];
  links?: PaginatedResponse<Message>['links'];
}

export const messagesApi = {
  async send(data: SendMessageRequest): Promise<Message> {
    const response = await apiClient.post<{ data: Message }>('/api/v1/messages', data);
    return response.data.data;
  },

  async delete(messageId: number): Promise<void> {
    await apiClient.delete(`/api/v1/messages/${messageId}`);
  },

  async getConversation(userId: number, params?: { page?: number }): Promise<PaginatedResponseWithConversation<Message>> {
    try {
      const response = await apiClient.get<MessageConversationPayload>(`/api/v1/messages/conversation/${userId}`, { params });
      const payload = response?.data ?? {};
      const conversationWith = payload.conversation_with;

      // Handle format { messages: [...], meta: {...} }
      if (payload.messages) {
          const messagesData = payload.messages;
          const messagesArray = Array.isArray(messagesData) ? messagesData : messagesData.data ?? [];
          const messagesMeta = Array.isArray(messagesData)
            ? {
                current_page: 1,
                last_page: 1,
                per_page: 30,
                total: messagesArray.length,
                from: 1,
                to: messagesArray.length,
              }
            : messagesData.meta ?? {
                current_page: 1,
                last_page: 1,
                per_page: 30,
                total: messagesArray.length,
                from: 1,
                to: messagesArray.length,
              };
          const messagesLinks = Array.isArray(messagesData)
            ? {
                first: '',
                last: '',
                prev: null,
                next: null,
              }
            : messagesData.links ?? {
                first: '',
                last: '',
                prev: null,
                next: null,
              };

          return {
            data: messagesArray,
            meta: messagesMeta,
            links: messagesLinks,
            conversation_with: conversationWith,
          };
        }
      if (Array.isArray(payload.data)) {
        return {
          ...payload,
          conversation_with: conversationWith,
        } as PaginatedResponseWithConversation<Message>;
      }

      return {
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 30,
          total: 0,
          from: 0,
          to: 0,
        },
        links: {
          first: '',
          last: '',
          prev: null,
          next: null,
        },
        conversation_with: conversationWith,
      };
    } catch (error) {
      console.error('messagesApi.getConversation failed', error);
      return {
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 30,
          total: 0,
          from: 0,
          to: 0,
        },
        links: {
          first: '',
          last: '',
          prev: null,
          next: null,
        },
      };
    }
  },

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<{
        data?: Conversation[] | null;
        conversations?: Conversation[] | null;
      }>('/api/v1/messages/conversations');

      const payload = response?.data ?? {};
      const conversations = payload.data ?? payload.conversations;
      return Array.isArray(conversations) ? conversations : [];
    } catch (error) {
      console.error('messagesApi.getConversations failed', error);
      return [];
    }
  },
  // Group conversations
  async getGroupConversations(): Promise<any[]> {
    try {
      const response = await apiClient.get<{ data: any[] }>('/api/v1/conversations');
      return response.data.data ?? [];
    } catch (error) {
      console.error('messagesApi.getGroupConversations failed', error);
      return [];
    }
  },

  async createGroup(data: { group_name: string; participant_ids: number[] }) {
    const response = await apiClient.post('/api/v1/conversations', data);
    return response.data.data;
  },

  async getConversationMessages(conversationId: number, params?: { page?: number }) {
    const response = await apiClient.get(`/api/v1/conversations/${conversationId}/messages`, { params });
    return response.data.data;
  },

  async sendToConversation(conversationId: number, data: { content?: string; attachment_ids?: number[] }) {
    const response = await apiClient.post(`/api/v1/conversations/${conversationId}/messages`, data);
    return response.data.data;
  },
};
