import apiClient from './client';
import type { Task, TaskComment, TaskStatus } from '@/types/models';
import type { CreateTaskRequest, UpdateTaskRequest, PaginatedResponse } from '@/types/api';

export const tasksApi = {
  async list(params?: { project_id?: number; status?: string; assignee_id?: number; page?: number }): Promise<PaginatedResponse<Task>> {
    if (!params?.project_id) {
      throw new Error('Project ID is required to list tasks.');
    }

    const { project_id, ...queryParams } = params;
    const response = await apiClient.get<{ tasks: Task[]; meta?: unknown; links?: unknown }>(`/api/v1/projects/${project_id}/tasks`, {
      params: queryParams,
    });

    return {
      data: response.data.tasks,
      meta: (response.data as any).meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: response.data.tasks.length,
        total: response.data.tasks.length,
      },
      links: (response.data as any).links ?? {
        first: '',
        last: '',
        prev: null,
        next: null,
      },
    };
  },

  async get(id: number): Promise<Task> {
    const response = await apiClient.get<{ task: Task }>(`/api/v1/tasks/${id}`);
    return response.data.task;
  },

  async create(data: CreateTaskRequest): Promise<Task> {
    const projectId = data.project_id;
    if (!projectId) {
      throw new Error('Project ID is required to create a task.');
    }

    const response = await apiClient.post<{ task: Task }>(`/api/v1/projects/${projectId}/tasks`, data);
    return response.data.task;
  },

  async update(id: number, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.put<{ task: Task }>(`/api/v1/tasks/${id}`, data);
    return response.data.task;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${id}`);
  },

  async updateStatus(id: number, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<{ task: Task }>(`/api/v1/tasks/${id}/status`, { status });
    return response.data.task;
  },

  async assign(id: number, assigneeId: number): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/api/v1/tasks/${id}/assign`, { assignee_id: assigneeId });
    return response.data.task;
  },

  async validate(id: number): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/api/v1/tasks/${id}/validate`);
    return response.data.task;
  },

  async refuse(id: number): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/api/v1/tasks/${id}/refuse`);
    return response.data.task;
  },

  async getKanban(projectId: number): Promise<Record<TaskStatus, Task[]>> {
    const response = await apiClient.get<{ kanban: Record<TaskStatus, Task[]> }>(`/api/v1/projects/${projectId}/tasks/kanban`);
    return response.data.kanban;
  },

  async getComments(taskId: number): Promise<TaskComment[]> {
    const response = await apiClient.get<{ comments: TaskComment[] }>(`/api/v1/tasks/${taskId}/comments`);
    return response.data.comments;
  },

  async addComment(taskId: number, content: string): Promise<TaskComment> {
    const response = await apiClient.post<{ data: TaskComment }>(`/api/v1/tasks/${taskId}/comments`, { content });
    return response.data.data;
  },

  async deleteComment(taskId: number, commentId: number): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}/comments/${commentId}`);
  },

  async uploadAttachment(taskId: number, file: FormData): Promise<void> {
    await apiClient.post(`/api/v1/tasks/${taskId}/attachments`, file, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  async getTrash(projectId: number): Promise<Task[]> {
    const response = await apiClient.get<{ tasks: Task[] }>(`/api/v1/projects/${projectId}/tasks/trash`);
    return response.data.tasks;
  },

  async restore(taskId: number): Promise<Task> {
    const response = await apiClient.post<{ task: Task }>(`/api/v1/tasks/${taskId}/restore`);
    return response.data.task;
  },

  async forceDelete(taskId: number): Promise<void> {
    await apiClient.delete(`/api/v1/tasks/${taskId}/force`);
  },
};
