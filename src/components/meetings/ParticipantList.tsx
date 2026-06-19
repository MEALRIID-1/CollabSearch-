'use client';

import { Users } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils/cn';
import type { VideoConferenceParticipant } from '@/types/video-conference';

interface ParticipantListProps {
  participants: VideoConferenceParticipant[];
  className?: string;
}

export function ParticipantList({ participants, className }: ParticipantListProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl bg-neutral-900/90 backdrop-blur-md border border-white/10 shadow-xl',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <Users className="h-4 w-4 text-white/70" />
        <span className="text-sm font-medium text-white">
          Participants ({participants.length})
        </span>
      </div>

      <ScrollArea className="max-h-64">
        <ul className="p-2 space-y-1">
          {participants.length === 0 ? (
            <li className="px-3 py-4 text-center text-sm text-white/50">
              En attente de participants...
            </li>
          ) : (
            participants.map((participant) => (
              <li
                key={participant.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-semibold text-primary">
                  {participant.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {participant.displayName}
                  </p>
                  {participant.isModerator && (
                    <p className="text-xs text-amber-400">Organisateur</p>
                  )}
                </div>
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
              </li>
            ))
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
