import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '@/lib/api/meetings';
import type { CreateMeetingRequest } from '@/types/api';

export function useMeetings(params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: () => meetingsApi.list(params),
  });
}

export function useMeeting(id: number) {
  return useQuery({
    queryKey: ['meeting', id],
    queryFn: () => meetingsApi.get(id),
    enabled: !!id,
  });
}

export function useMeetingCalendar(month?: number, year?: number) {
  return useQuery({
    queryKey: ['meeting-calendar', month, year],
    queryFn: () => meetingsApi.getCalendar(month, year),
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateMeetingRequest) => meetingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'meeting-calendar' });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateMeetingRequest> }) =>
      meetingsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'meeting-calendar' });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => meetingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'meeting-calendar' });
    },
  });
}
