'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { useMeeting } from '@/lib/hooks/use-meetings';

export default function MeetingReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const meetingId = Number(id);
  const router = useRouter();
  const { data: meeting, isLoading, error } = useMeeting(meetingId);
  const [videoError, setVideoError] = useState(false);

  const recordingUrl = (meeting as any)?.recording_url ?? null;
  const transcript = (meeting as any)?.recording_transcript ?? null;
  const summary = (meeting as any)?.meeting_summary ?? null;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Chargement de l'enregistrement..." size="lg" />
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

  if (!recordingUrl) {
    return (
      <AppLayout>
        <EmptyState
          title="Aucun enregistrement disponible"
          description="Cette réunion n'a pas d'enregistrement associé."
          actionLabel="Retour au calendrier"
          onAction={() => router.push('/calendar')}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/calendar')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Replay — {meeting.title}</h1>
              <p className="text-muted-foreground mt-1">Enregistrement de la visioconférence</p>
            </div>
          </div>
          <Link href={`/meetings/${meeting.id}/summary`}>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white shadow-sm shrink-0">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Compte-rendu complet par IA
            </Button>
          </Link>
        </div>

        <div className="rounded-2xl overflow-hidden border bg-black shadow-xl aspect-video">
          {!videoError ? (
            <video
              src={recordingUrl}
              controls
              className="h-full w-full"
              onError={() => setVideoError(true)}
            >
              Votre navigateur ne supporte pas la lecture vidéo.
            </video>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 bg-neutral-900 text-white p-8">
              <p className="text-center text-muted-foreground">
                La lecture intégrée n&apos;est pas disponible pour ce format.
              </p>
              <Button asChild variant="secondary">
                <a href={recordingUrl} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger l&apos;enregistrement
                </a>
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {summary && (
            <div className="rounded-xl border bg-violet-50 p-6">
              <div className="flex items-center gap-2 font-semibold text-violet-800 mb-3">
                <Sparkles className="h-5 w-5" />
                Résumé IA
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</p>
            </div>
          )}

          {transcript && (
            <div className="rounded-xl border bg-white p-6">
              <div className="flex items-center gap-2 font-semibold text-gray-800 mb-3">
                <FileText className="h-5 w-5" />
                Transcription
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {transcript}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
