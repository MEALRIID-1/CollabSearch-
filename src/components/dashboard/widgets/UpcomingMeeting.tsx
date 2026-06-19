'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Video, MapPin, Users } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';
import { useMeetings } from '@/lib/hooks/use-meetings';
import { differenceInMinutes, parseISO } from 'date-fns';

export function UpcomingMeeting() {
  const { data } = useMeetings({ page: 1, status: 'scheduled' });
  const meetings = data?.data ?? [];
  const now = new Date();
  const next = meetings.find((m) => new Date(m.date) > now);

  if (!next) {
    return (
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Prochaine réunion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Aucune réunion planifiée</p>
            <Link href="/calendar">
              <Button variant="outline" size="sm" className="mt-3 text-xs">Ouvrir le calendrier</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const minutesLeft = differenceInMinutes(parseISO(next.date), now);
  const hours = Math.floor(minutesLeft / 60);
  const mins  = minutesLeft % 60;
  const countdown = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Prochaine réunion</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
          <p className="font-semibold text-sm truncate">{next.title}</p>
          {next.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{next.description}</p>
          )}
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            {formatDateTime(next.date)}
            <span className="text-blue-600 font-medium ml-auto">dans {countdown}</span>
          </span>
          {next.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {next.location}
            </span>
          )}
          {next.participants && next.participants.length > 0 && (
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {next.participants.length} participant{next.participants.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {next.is_online && next.link && (
          <Link href={next.link} target="_blank">
            <Button className="w-full text-xs bg-blue-600 hover:bg-blue-700 h-8 gap-1.5">
              <Video className="h-3.5 w-3.5" />
              Rejoindre
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
