import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api/projects';
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types/api';

export function useProjects(params?: { page?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsApi.list(params),
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'], exact: false });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProjectRequest }) => projectsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useProjectWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, id, data }: { action: 'submit' | 'approve' | 'reject' | 'archive'; id: number; data?: { reason?: string } }) => {
      switch (action) {
        case 'submit': return projectsApi.submit(id);
        case 'approve': return projectsApi.approve(id);
        case 'reject': return projectsApi.reject(id, data?.reason);
        case 'archive': return projectsApi.archive(id);
      }
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });
}

export function useProjectMembers(projectId: number) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => projectsApi.get(projectId).then((p) => p.members),
    enabled: !!projectId,
  });
}

export function useProjectMilestones(projectId: number) {
  return useQuery({
    queryKey: ['project-milestones', projectId],
    queryFn: () => projectsApi.getMilestones(projectId),
    enabled: !!projectId,
    staleTime: 0,
  });
}
