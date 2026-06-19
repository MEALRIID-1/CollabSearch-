import apiClient from './client';
import type { Notification } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';

export const notificationsApi = {
  async list(params?: { page?: number }): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get<PaginatedResponse<Notification>>('/api/v1/notifications', { params });
    return response.data;
  },

  async markRead(id: number): Promise<void> {
    await apiClient.put(`/api/v1/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await apiClient.put('/api/v1/notifications/read-all');
  },

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ data: { count: number } }>('/api/v1/notifications/unread-count');
    return response.data.data.count;
  },
};
