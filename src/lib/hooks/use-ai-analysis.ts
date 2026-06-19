import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { aiApi, type AiAnalysisResponse } from '@/lib/api/ai';
import { useState, useEffect } from 'react';

export function useAiAnalysis(uuid: string | null, enabled = false) {
  const [refetchInterval, setRefetchInterval] = useState<number | false>(2000);

  const query = useQuery({
    queryKey: ['ai-analysis', uuid],
    queryFn: () => aiApi.getAnalysis(uuid!),
    enabled: enabled && !!uuid,
    refetchInterval: (query) => {
      const status = query.state.data?.analysis?.status;
      if (status === 'completed' || status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
  });

  return query;
}

export function useAnalyzeMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ meetingId, force }: { meetingId: number; force?: boolean }) =>
      aiApi.analyzeMeeting(meetingId, force),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', variables.meetingId] });
      queryClient.invalidateQueries({ queryKey: ['ai-analysis', data.analysis.uuid] });
    },
  });
}

export function useAnalyzePublicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ publicationId, force }: { publicationId: number; force?: boolean }) =>
      aiApi.analyzePublication(publicationId, force),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['publication', variables.publicationId] });
      queryClient.invalidateQueries({ queryKey: ['ai-analysis', data.analysis.uuid] });
    },
  });
}
