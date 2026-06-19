import apiClient from './client';
import type { PaginatedResponse } from '@/types/api';
import type { User } from '@/types/models';

export const adminUsersApi = {
  async list(params?: { page?: number; search?: string; custom_role_uuid?: string; is_active?: boolean }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User> | { users: User[]; meta: PaginatedResponse<User>['meta'] }>('/api/v1/admin/my-users', {
      params,
    });

    const payload = response.data as any;
    if (Array.isArray(payload.data)) {
      return payload as PaginatedResponse<User>;
    }

    if (payload.users) {
      const usersPayload = payload.users;
      const usersArray = Array.isArray(usersPayload) ? usersPayload : usersPayload.data;
      const usersMeta = payload.meta ?? usersPayload.meta;
      const usersLinks = payload.links ?? usersPayload.links;

      if (Array.isArray(usersArray) && usersMeta) {
        return {
          data: usersArray,
          meta: usersMeta,
          links: usersLinks ?? { first: '', last: '', prev: null, next: null },
        };
      }
    }

    return {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
      links: { first: '', last: '', prev: null, next: null },
    };
  },

  async get(id: number): Promise<User> {
    const response = await apiClient.get<{ user: User }>(`/api/v1/admin/my-users/${id}`);
    return response.data.user;
  },

  async update(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ user: User }>(`/api/v1/admin/my-users/${id}`, data);
    return response.data.user;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/admin/my-users/${id}`);
  },

  async trashed(params?: { page?: number; search?: string; role?: string }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User> | { users: User[]; meta: PaginatedResponse<User>['meta'] }>('/api/v1/admin/my-users/trashed', {
      params,
    });

    const payload = response.data as any;
    if (Array.isArray(payload.data)) {
      return payload as PaginatedResponse<User>;
    }

    if (payload.users) {
      const usersPayload = payload.users;
      const usersArray = Array.isArray(usersPayload) ? usersPayload : usersPayload.data;
      const usersMeta = payload.meta ?? usersPayload.meta;
      const usersLinks = payload.links ?? usersPayload.links;

      if (Array.isArray(usersArray) && usersMeta) {
        return {
          data: usersArray,
          meta: usersMeta,
          links: usersLinks ?? { first: '', last: '', prev: null, next: null },
        };
      }
    }

    return {
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 15, total: 0, from: 0, to: 0 },
      links: { first: '', last: '', prev: null, next: null },
    };
  },

  async restore(id: number): Promise<User> {
    const response = await apiClient.post<{ user: User }>(`/api/v1/admin/my-users/${id}/restore`);
    return response.data.user;
  },

  /** Returns user + generated password (when admin left password blank). */
  async create(data: Partial<User>): Promise<{ user: User; password?: string }> {
    const response = await apiClient.post<{ user: User; password?: string }>('/api/v1/admin/my-users', data);
    return { user: response.data.user, password: response.data.password ?? undefined };
  },

  async invite(data: Partial<User>): Promise<User> {
    const response = await apiClient.post<{ user: User }>('/api/v1/admin/my-users/invite', data);
    return response.data.user;
  },
};
