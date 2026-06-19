import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { videoConferenceApi } from '@/lib/api/video-conference';
import type { VideoConferenceRecording } from '@/types/video-conference';

export function useJoinVideoRoom(meetingId: number, enabled = false) {
  return useQuery({
    queryKey: ['video-conference', 'join', meetingId],
    queryFn: () => videoConferenceApi.joinRoom(meetingId),
    enabled: enabled && !!meetingId,
    staleTime: 0,
    retry: 1,
  });
}

export function useJoinVideoRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: number) => videoConferenceApi.joinRoom(meetingId),
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['video-conference', 'join', meetingId] });
    },
  });
}

export function useEndVideoRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (meetingId: number) => videoConferenceApi.endRoom(meetingId),
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ predicate: (query) => query.queryKey[0] === 'meeting-calendar' });
    },
  });
}

export function useSaveRecording() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, data }: { meetingId: number; data: Partial<VideoConferenceRecording> }) =>
      videoConferenceApi.saveRecording(meetingId, data),
    onSuccess: (_, { meetingId }) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
    },
  });
}
