'use client';

import { Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface VideoRoomControlsProps {
  isAudioMuted: boolean;
  isVideoMuted: boolean;
  isScreenSharing: boolean;
  isOrganizer: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare: () => void;
  onEndMeeting: () => void;
  onLeave: () => void;
  className?: string;
}

export function VideoRoomControls({
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  isOrganizer,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onEndMeeting,
  onLeave,
  className,
}: VideoRoomControlsProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-3 rounded-2xl bg-neutral-900/90 px-6 py-4 backdrop-blur-md shadow-2xl border border-white/10',
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleAudio}
        className={cn(
          'h-12 w-12 rounded-full text-white hover:bg-white/10',
          isAudioMuted && 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        )}
        aria-label={isAudioMuted ? 'Activer le micro' : 'Couper le micro'}
      >
        {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleVideo}
        className={cn(
          'h-12 w-12 rounded-full text-white hover:bg-white/10',
          isVideoMuted && 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
        )}
        aria-label={isVideoMuted ? 'Activer la caméra' : 'Couper la caméra'}
      >
        {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleScreenShare}
        className={cn(
          'h-12 w-12 rounded-full text-white hover:bg-white/10',
          isScreenSharing && 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
        )}
        aria-label={isScreenSharing ? 'Arrêter le partage' : 'Partager l\'écran'}
      >
        <MonitorUp className="h-5 w-5" />
      </Button>

      {/* Bouton Quitter (tous les participants) */}
      {!isOrganizer && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeave}
          className="h-12 w-12 rounded-full ml-2 text-orange-400 hover:bg-orange-500/20 hover:text-orange-300"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      )}

      {/* Bouton Terminer (organisateur uniquement) */}
      {isOrganizer && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onEndMeeting}
          className="h-12 w-12 rounded-full ml-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
