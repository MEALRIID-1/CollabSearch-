import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/lib/api/tasks';
import type { CreateTaskRequest, UpdateTaskRequest } from '@/types/api';
import type { TaskStatus } from '@/types/models';

export function useTasks(params?: { project_id?: number; status?: string; assignee_id?: number }) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => tasksApi.list(params),
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useKanban(projectId: number) {
  return useQuery({
    queryKey: ['kanban', projectId],
    queryFn: () => tasksApi.getKanban(projectId),
    enabled: !!projectId,
    staleTime: 0,
  });
}

// Helper : invalide kanban + tâches + jalons + dashboard + projet en une fois
function invalidateTaskRelated(queryClient: ReturnType<typeof useQueryClient>, taskId?: number) {
  queryClient.invalidateQueries({ queryKey: ['tasks'] });
  queryClient.invalidateQueries({ queryKey: ['kanban'] });
  if (taskId !== undefined) {
    queryClient.invalidateQueries({ queryKey: ['task', taskId] });
  }
  // Jalons : une tâche créée/modifiée peut décocher un jalon complété
  queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
  // Synchronise le tableau de bord et les stats projet après toute action sur une tâche
  queryClient.invalidateQueries({ queryKey: ['project'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  queryClient.invalidateQueries({ queryKey: ['stats'] });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskRequest) => tasksApi.create(data),
    onSuccess: () => invalidateTaskRelated(queryClient),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskRequest }) => tasksApi.update(id, data),
    onSuccess: (_, { id }) => invalidateTaskRelated(queryClient, id),
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => tasksApi.updateStatus(id, status),
    onSuccess: (_, { id }) => invalidateTaskRelated(queryClient, id),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      invalidateTaskRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ['task-trash'] });
    },
  });
}

export function useAssignTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, assigneeId }: { id: number; assigneeId: number }) => tasksApi.assign(id, assigneeId),
    onSuccess: () => invalidateTaskRelated(queryClient),
  });
}

export function useValidateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.validate(id),
    onSuccess: (_, id) => {
      invalidateTaskRelated(queryClient, id);
      queryClient.invalidateQueries({ queryKey: ['project-milestones'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
    },
  });
}

export function useRefuseTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.refuse(id),
    onSuccess: (_, id) => invalidateTaskRelated(queryClient, id),
  });
}

export function useTaskTrash(projectId: number) {
  return useQuery({
    queryKey: ['task-trash', projectId],
    queryFn: () => tasksApi.getTrash(projectId),
    enabled: !!projectId,
    staleTime: 0,
  });
}

export function useRestoreTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.restore(id),
    onSuccess: () => {
      invalidateTaskRelated(queryClient);
      queryClient.invalidateQueries({ queryKey: ['task-trash'] });
    },
  });
}

export function useForceDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tasksApi.forceDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-trash'] });
    },
  });
}

export function useTaskComments(taskId: number) {
  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: () => tasksApi.getComments(taskId),
    enabled: !!taskId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: number; content: string }) => tasksApi.addComment(taskId, content),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    },
  });
}
