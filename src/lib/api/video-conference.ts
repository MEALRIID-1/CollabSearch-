import apiClient from './client';
import type { VideoConferenceJoinResponse, VideoConferenceRecording } from '@/types/video-conference';
import type { Meeting } from '@/types/models';

function normalizeRecording(raw: any): VideoConferenceRecording {
  return {
    recording_url: raw.recording_url ?? null,
    recording_transcript: raw.recording_transcript ?? null,
    meeting_summary: raw.meeting_summary ?? null,
    actual_duration_minutes: raw.actual_duration_minutes ?? null,
  };
}

export const videoConferenceApi = {
  async joinRoom(meetingId: number): Promise<VideoConferenceJoinResponse> {
    const response = await apiClient.get(`/api/v1/meetings/${meetingId}/join`);
    return response.data;
  },

  async endRoom(meetingId: number): Promise<{ meeting: Meeting; message: string }> {
    const response = await apiClient.post(`/api/v1/meetings/${meetingId}/end`);
    return response.data;
  },

  async saveRecording(
    meetingId: number,
    data: Partial<VideoConferenceRecording>
  ): Promise<{ meeting: Meeting; message: string }> {
    const response = await apiClient.post(`/api/v1/meetings/${meetingId}/recording`, data);
    return response.data;
  },
};

export { normalizeRecording };
