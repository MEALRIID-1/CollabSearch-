'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { LogOut, Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';
import type IJitsiMeetExternalApi from '@jitsi/react-sdk/lib/types/IJitsiMeetExternalApi';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { RecordingIndicator } from './RecordingIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import type { VideoConferenceJoinResponse, VideoConferenceParticipant } from '@/types/video-conference';

const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
  { ssr: false, loading: () => <LoadingSpinner text="Chargement de la visioconference..." size="lg" /> }
);

interface VideoRoomProps {
  conference: VideoConferenceJoinResponse;
  isOrganizer: boolean;
  onReadyToClose: () => void;
  onEndMeeting: () => void;
}

export function VideoRoom({ conference, isOrganizer, onReadyToClose, onEndMeeting }: VideoRoomProps) {
  const apiRef = useRef<IJitsiMeetExternalApi | null>(null);
  const [participants, setParticipants] = useState<VideoConferenceParticipant[]>([]);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const domain = conference.domain || process.env.NEXT_PUBLIC_JITSI_SERVER?.replace(/^https?:\/\//, '') || 'meet.jit.si';

  const syncParticipants = useCallback(() => {
    const api = apiRef.current;
    if (!api) return;
    try {
      const infos = api.getParticipantsInfo() as Array<{ participantId: string; displayName?: string }>;
      const list: VideoConferenceParticipant[] = infos.map((info) => ({
        id: info.participantId,
        displayName: api.getDisplayName(info.participantId) || info.displayName || 'Participant',
        email: api.getEmail(info.participantId) || undefined,
      }));
      setParticipants(list);
    } catch { /* ignore */ }
  }, []);

  const handleApiReady = useCallback(
    (api: IJitsiMeetExternalApi) => {
      apiRef.current = api;
      api.addListener('participantJoined', () => syncParticipants());
      api.addListener('participantLeft', () => syncParticipants());
      api.addListener('audioMuteStatusChanged', (p: { muted: boolean }) => setIsAudioMuted(p.muted));
      api.addListener('videoMuteStatusChanged', (p: { muted: boolean }) => setIsVideoMuted(p.muted));
      api.addListener('screenSharingStatusChanged', (p: { on: boolean }) => setIsScreenSharing(p.on));
      api.addListener('recordingStatusChanged', (p: { on: boolean }) => setIsRecording(p.on));
      api.addListener('readyToClose', () => onReadyToClose());
      api.addListener('videoConferenceLeft', () => onReadyToClose());
      syncParticipants();
    },
    [syncParticipants, onReadyToClose]
  );

  useEffect(() => {
    return () => {
      apiRef.current?.dispose();
      apiRef.current = null;
    };
  }, []);

  const exec = (cmd: string) => apiRef.current?.executeCommand(cmd);

  const meetingProps = {
    roomName: conference.room_id,
    jwt: conference.jwt ?? undefined,
    userInfo: { displayName: conference.user.name, email: conference.user.email },
    lang: 'fr',
    configOverwrite: {
      startWithAudioMuted: false,
      startWithVideoMuted: false,
      prejoinPageEnabled: false,
      disableDeepLinking: true,
      enableWelcomePage: false,
      toolbarButtons: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview', 'fullscreen'],
    },
    interfaceConfigOverwrite: {
      SHOW_JITSI_WATERMARK: false,
      SHOW_WATERMARK_FOR_GUESTS: false,
      TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview', 'fullscreen'],
    },
    onApiReady: handleApiReady,
    onReadyToClose,
    getIFrameRef: (node: HTMLDivElement) => {
      if (node) { node.style.height = '100%'; node.style.width = '100%'; }
    },
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-neutral-950">

      {/* Barre de controle — AU-DESSUS de l'iframe */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-neutral-900 border-b border-white/10">

        {/* Gauche : titre + enregistrement */}
        <div className="flex items-center gap-3 min-w-0">
          <RecordingIndicator isRecording={isRecording} />
          <span className="text-sm font-medium text-white truncate">
            {conference.meeting.title}
          </span>
        </div>

        {/* Centre : micro / camera */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => exec('toggleAudio')}
            className={cn(
              'h-9 w-9 rounded-full text-white hover:bg-white/10',
              isAudioMuted && 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            )}
            title={isAudioMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isAudioMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => exec('toggleVideo')}
            className={cn(
              'h-9 w-9 rounded-full text-white hover:bg-white/10',
              isVideoMuted && 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            )}
            title={isVideoMuted ? 'Activer la camera' : 'Couper la camera'}
          >
            {isVideoMuted ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
        </div>

        {/* Droite : participants + quitter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50 hidden md:block">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
          </span>

          {/* Quitter sans terminer */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { exec('hangup'); onReadyToClose(); }}
            className="h-9 px-3 rounded-full bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 gap-1.5"
            title="Quitter la reunion"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Quitter</span>
          </Button>

          {/* Terminer pour tous (organisateur seulement) */}
          {isOrganizer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { exec('hangup'); onEndMeeting(); }}
              className="h-9 px-3 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 gap-1.5"
              title="Terminer la reunion pour tous"
            >
              <PhoneOff className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Terminer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Zone Jitsi */}
      <div className="flex-1 overflow-hidden">
        <JitsiMeeting {...meetingProps} />
      </div>
    </div>
  );
}
