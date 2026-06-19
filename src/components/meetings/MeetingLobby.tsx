'use client';

import { Calendar, Clock, MapPin, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { MEETING_STATUSES } from '@/lib/utils/constants';
import { formatDate } from '@/lib/utils/format';
import type { Meeting } from '@/types/models';
import { cn } from '@/lib/utils/cn';

interface MeetingLobbyProps {
  meeting: Meeting;
  isJoining: boolean;
  onJoin: () => void;
  onCancel: () => void;
  className?: string;
}

export function MeetingLobby({ meeting, isJoining, onJoin, onCancel, className }: MeetingLobbyProps) {
  const statusInfo = MEETING_STATUSES[meeting.status];

  return (
    <div className={cn('flex min-h-[calc(100vh-4rem)] items-center justify-center p-6', className)}>
      <div className="w-full max-w-lg rounded-2xl border bg-white shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-8 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Video className="h-7 w-7 text-primary" />
            </div>
            <Badge className={statusInfo.bgColor} style={{ color: statusInfo.color }}>
              {statusInfo.label}
            </Badge>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{meeting.title}</h1>
          {meeting.description && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{meeting.description}</p>
          )}
        </div>

        <div className="px-8 py-6 space-y-4">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-primary shrink-0" />
            <span>{formatDate(meeting.date)}</span>
          </div>

          {meeting.end_date && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-primary shrink-0" />
              <span>Jusqu&apos;à {formatDate(meeting.end_date)}</span>
            </div>
          )}

          {meeting.location && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span>{meeting.location}</span>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Users className="h-4 w-4 text-primary shrink-0" />
            <span>
              Organisé par {meeting.organizer?.full_name ?? 'Inconnu'}
              {meeting.participants?.length > 0 && (
                <> · {meeting.participants.length} participant(s)</>
              )}
            </span>
          </div>

          <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mt-2">
            <p className="text-sm text-blue-800">
              Vérifiez votre micro et caméra avant de rejoindre la visioconférence intégrée CollabSearch.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t bg-gray-50 px-8 py-5">
          <Button variant="outline" onClick={onCancel} disabled={isJoining} className="flex-1">
            Retour
          </Button>
          <Button onClick={onJoin} disabled={isJoining} className="flex-1 gap-2">
            {isJoining ? (
              <>
                <LoadingSpinner size="sm" />
                Connexion...
              </>
            ) : (
              <>
                <Video className="h-4 w-4" />
                Rejoindre la réunion
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
