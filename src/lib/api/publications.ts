import apiClient from './client';
import type { Publication } from '@/types/models';
import type { CreatePublicationRequest, PaginatedResponse } from '@/types/api';

export const publicationsApi = {
  async list(params?: { page?: number; type?: string; search?: string }): Promise<PaginatedResponse<Publication>> {
    const response = await apiClient.get('/api/v1/publications', { params });
    const pubs = response.data.publications ?? response.data.data ?? [];
    const meta = response.data.meta ?? {};
    return {
      data: pubs,
      meta: {
        current_page: meta.current_page ?? 1,
        last_page: meta.last_page ?? 1,
        per_page: meta.per_page ?? meta.per_page ?? 15,
        total: meta.total ?? (Array.isArray(pubs) ? pubs.length : 0),
        from: meta.from ?? 1,
        to: meta.to ?? (Array.isArray(pubs) ? pubs.length : 0),
      },
      links: response.data.links ?? { first: '', last: '', prev: null, next: null },
    };
  },

  async get(id: number): Promise<Publication> {
    const response = await apiClient.get(`/api/v1/publications/${id}`);
    return response.data.publication ?? response.data.data;
  },

  async create(data: FormData): Promise<Publication> {
    const response = await apiClient.post('/api/v1/publications', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.publication ?? response.data.data;
  },

  async update(id: number, data: FormData): Promise<Publication> {
    const response = await apiClient.post(`/api/v1/publications/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.publication ?? response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/publications/${id}`);
  },

  async search(query: string, filters?: { type?: string; year?: number }): Promise<Publication[]> {
    const response = await apiClient.get<{ data: Publication[] }>('/api/v1/publications/search', {
      params: { q: query, ...filters },
    });
    return response.data.data;
  },

  async exportBibtex(): Promise<string> {
    const response = await apiClient.get<string>(`/api/v1/publications/export/bibtex`, {
      responseType: 'text',
    });
    return response.data;
  },

  async exportApa(): Promise<string> {
    const response = await apiClient.get<string>(`/api/v1/publications/export/apa`, {
      responseType: 'text',
    });
    return response.data;
  },
};
