import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicationsApi } from '@/lib/api/publications';

export function usePublications(params?: { page?: number; type?: string; search?: string }) {
  return useQuery({
    queryKey: ['publications', params],
    queryFn: () => publicationsApi.list(params),
  });
}

export function usePublication(id: number) {
  return useQuery({
    queryKey: ['publication', id],
    queryFn: () => publicationsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => publicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
    },
  });
}

export function useUpdatePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => publicationsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
      queryClient.invalidateQueries({ queryKey: ['publication', id] });
    },
  });
}

export function useDeletePublication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => publicationsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publications'] });
    },
  });
}

export function useSearchPublications(query: string, filters?: { type?: string; year?: number }) {
  return useQuery({
    queryKey: ['publications-search', query, filters],
    queryFn: () => publicationsApi.search(query, filters),
    enabled: query.length > 0,
  });
}
