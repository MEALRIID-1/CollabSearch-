'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { MeetingLobby } from '@/components/meetings/MeetingLobby';
import { VideoRoom } from '@/components/meetings/VideoRoom';
import { MeetingEndScreen } from '@/components/meetings/MeetingEndScreen';
import { useMeeting } from '@/lib/hooks/use-meetings';
import { useJoinVideoRoomMutation, useEndVideoRoom } from '@/lib/hooks/use-video-conference';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { VideoConferenceJoinResponse, VideoConferenceRecording } from '@/types/video-conference';
import { toast } from 'sonner';

type RoomPhase = 'lobby' | 'in-call' | 'ended';

export default function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const meetingId = Number(id);
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: meeting, isLoading, error } = useMeeting(meetingId);
  const joinMutation = useJoinVideoRoomMutation();
  const endMutation = useEndVideoRoom();

  const [phase, setPhase] = useState<RoomPhase>('lobby');
  const [conference, setConference] = useState<VideoConferenceJoinResponse | null>(null);
  const [endData, setEndData] = useState<VideoConferenceRecording | null>(null);

  const isOrganizer = meeting?.organizer_id === user?.id;

  const handleJoin = async () => {
    try {
      const data = await joinMutation.mutateAsync(meetingId);
      setConference(data);
      setPhase('in-call');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Impossible de rejoindre la réunion.');
    }
  };

  const handleEndMeeting = async () => {
    if (!isOrganizer) return;
    try {
      const result = await endMutation.mutateAsync(meetingId);
      const raw = result.meeting as any;
      setEndData({
        actual_duration_minutes: raw.actual_duration_minutes ?? null,
        recording_url: raw.recording_url ?? null,
        recording_transcript: raw.recording_transcript ?? null,
        meeting_summary: raw.meeting_summary ?? null,
      });
      setPhase('ended');
      toast.success('Réunion terminée.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Erreur lors de la fin de la réunion.');
    }
  };

  // Quitter la réunion → affiche l'écran de fin avec bouton Analyser
  // La navigation vers /calendar se fait via onClose sur MeetingEndScreen
  const handleLeave = () => {
    setPhase('ended');
  };

  const handleClose = () => {
    window.location.replace('/calendar');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Chargement de la réunion..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !meeting) {
    return (
      <AppLayout>
        <EmptyState
          title="Réunion introuvable"
          description="Cette réunion n'existe pas ou vous n'y avez pas accès."
          actionLabel="Retour au calendrier"
          onAction={() => router.push('/calendar')}
        />
      </AppLayout>
    );
  }

  if (phase === 'ended') {
    return (
      <AppLayout>
        <MeetingEndScreen
          meetingId={meetingId}
          meeting={meeting}
          recording={endData}
          onClose={handleClose}
        />
      </AppLayout>
    );
  }

  if (phase === 'in-call' && conference) {
    return (
      <AppLayout>
        <VideoRoom
          conference={conference}
          isOrganizer={!!isOrganizer}
          onReadyToClose={handleLeave}
          onEndMeeting={handleEndMeeting}
        />
      </AppLayout>
    );
  }

  // Phase lobby (défaut)
  return (
    <AppLayout>
      <MeetingLobby
        meeting={meeting}
        isJoining={joinMutation.isPending}
        onJoin={handleJoin}
        onCancel={() => router.push('/calendar')}
      />
    </AppLayout>
  );
}
