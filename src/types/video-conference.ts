// Types visioconférence Jitsi - CollabSearch

export interface VideoConferenceUser {
  id: number;
  name: string;
  email: string;
}

export interface VideoConferenceJoinResponse {
  room_id: string;
  room_url: string;
  jwt: string | null;
  server_url: string;
  domain: string;
  app_id: string;
  user: VideoConferenceUser;
  meeting: {
    id: number;
    title: string;
    started_at: string | null;
  };
}

export interface VideoConferenceParticipant {
  id: string;
  displayName: string;
  email?: string;
  isModerator?: boolean;
}

export interface VideoConferenceRecording {
  recording_url: string | null;
  recording_transcript: string | null;
  meeting_summary: string | null;
  actual_duration_minutes: number | null;
}
