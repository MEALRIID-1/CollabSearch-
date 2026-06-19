import apiClient from './client';
import type { Project, Milestone } from '@/types/models';
import type { CreateProjectRequest, UpdateProjectRequest, PaginatedResponse } from '@/types/api';

interface ProjectsListResponse {
  projects: Project[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
  };
  links?: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
}

export const projectsApi = {
  async list(params?: { page?: number; status?: string; search?: string }): Promise<PaginatedResponse<Project>> {
    const response = await apiClient.get<ProjectsListResponse>('/api/v1/projects', { params });
    return {
      data: response.data.projects,
      meta: response.data.meta,
      links: response.data.links ?? {
        first: '',
        last: '',
        prev: null,
        next: null,
      },
    };
  },

  async get(id: number): Promise<Project> {
    const response = await apiClient.get<{ project: Project }>(`/api/v1/projects/${id}`);
    return response.data.project;
  },

  async create(data: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<{ data: Project }>('/api/v1/projects', data);
    return response.data.data;
  },

  async update(id: number, data: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<{ data: Project }>(`/api/v1/projects/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/projects/${id}`);
  },

  async submit(id: number): Promise<Project> {
    const response = await apiClient.post<{ data: Project }>(`/api/v1/projects/${id}/submit`);
    return response.data.data;
  },

  async approve(id: number): Promise<Project> {
    const response = await apiClient.post<{ data: Project }>(`/api/v1/projects/${id}/approve`);
    return response.data.data;
  },

  async reject(id: number, reason?: string): Promise<Project> {
    const response = await apiClient.post<{ data: Project }>(`/api/v1/projects/${id}/reject`, { reason });
    return response.data.data;
  },

  async archive(id: number): Promise<Project> {
    const response = await apiClient.post<{ data: Project }>(`/api/v1/projects/${id}/archive`);
    return response.data.data;
  },

  async addMember(projectId: number, userId: number): Promise<void> {
    await apiClient.post(`/api/v1/projects/${projectId}/members`, { user_id: userId });
  },

  async removeMember(projectId: number, userId: number): Promise<void> {
    await apiClient.delete(`/api/v1/projects/${projectId}/members`, { data: { user_id: userId } });
  },

  async getMilestones(projectId: number): Promise<Milestone[]> {
    const response = await apiClient.get<{ milestones: Milestone[] }>(`/api/v1/projects/${projectId}/milestones`);
    return response.data.milestones ?? [];
  },

  async createMilestone(projectId: number, data: Partial<Milestone>): Promise<Milestone> {
    const response = await apiClient.post<{ milestone: Milestone }>(`/api/v1/projects/${projectId}/milestones`, data);
    return response.data.milestone;
  },

  async updateMilestone(projectId: number, milestoneId: number, data: Partial<Milestone>): Promise<Milestone> {
    const response = await apiClient.put<{ data: Milestone }>(`/api/v1/projects/${projectId}/milestones/${milestoneId}`, data);
    return response.data.data;
  },
};
