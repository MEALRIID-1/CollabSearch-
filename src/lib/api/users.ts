import apiClient from './client';
import type { User, DashboardStats } from '@/types/models';
import type { PaginatedResponse } from '@/types/api';

export const usersApi = {
  async list(params?: { page?: number; per_page?: number; search?: string; role?: string }): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<PaginatedResponse<User> | { users: User[]; meta: PaginatedResponse<User>['meta'] }>('/api/v1/users', { params });

    const payload = response.data as any;
    if (Array.isArray(payload.data)) {
      return payload as PaginatedResponse<User>;
    }

    if (payload.users) {
      const usersPayload = payload.users;
      const usersArray = Array.isArray(usersPayload) ? usersPayload : usersPayload.data;
      const usersMeta = usersPayload.meta ?? payload.meta;
      const usersLinks = usersPayload.links ?? payload.links;

      if (Array.isArray(usersArray) && usersMeta) {
        return {
          data: usersArray,
          meta: usersMeta,
          links: usersLinks ?? {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
        };
      }
    }

    return {
      data: [],
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 15,
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
  },

  async get(id: number): Promise<User> {
    const response = await apiClient.get<{ data: User }>(`/api/v1/users/${id}`);
    return response.data.data;
  },

  async update(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ data: User }>(`/api/v1/users/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/users/${id}`);
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<{
      stats: {
        utilisateurs: { total: number; actifs: number; inactifs: number };
        projets: { total: number; actifs: number; en_attente: number; approuves: number; archives: number };
        publications: { total: number; publiees: number };
        budget: { total_alloue: number; total_depense: number };
      };
      recent_activities: unknown[];
    }>('/api/v1/admin/dashboard');

    const s = response.data.stats;
    return {
      total_projects:        s.projets.total,
      active_projects:       s.projets.actifs,
      total_tasks:           0, // non fourni par cet endpoint
      completed_tasks:       0,
      total_publications:    s.publications.total,
      total_budget_allocated: s.budget.total_alloue,
      total_budget_spent:    s.budget.total_depense,
      upcoming_meetings:     0, // non fourni par cet endpoint
      unread_notifications:  0,
    };
  },
};
