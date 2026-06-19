'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useMeeting } from '@/lib/hooks/use-meetings';
import { useAnalyzeMeetingMutation, useAiAnalysis } from '@/lib/hooks/use-ai-analysis';
import { MeetingSummaryCard } from '@/components/ai/MeetingSummaryCard';
import { AnalysisStatus } from '@/components/ai/AnalysisStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Calendar, Clock, Sparkles, RefreshCw, FileText, ArrowLeft } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function MeetingSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const meetingId = Number(id);
  const router = useRouter();

  const { data: meeting, isLoading: meetingLoading, error: meetingError, refetch: refetchMeeting } = useMeeting(meetingId);
  const analyzeMutation = useAnalyzeMeetingMutation();

  const [analysisUuid, setAnalysisUuid] = useState<string | null>(null);
  
  // Fetch analysis details if we have the UUID
  const { data: analysisData, isLoading: analysisLoading } = useAiAnalysis(
    analysisUuid,
    !!analysisUuid
  );

  const activeAnalysis = analysisData?.analysis;

  // Automatically check for existing analysis on load
  useEffect(() => {
    if (meetingId) {
      triggerAnalysis(false);
    }
  }, [meetingId]);

  const triggerAnalysis = async (force = false) => {
    try {
      const res = await analyzeMutation.mutateAsync({ meetingId, force });
      if (res.analysis?.uuid) {
        setAnalysisUuid(res.analysis.uuid);
        if (force) {
          toast.success("Nouvelle analyse demandée.");
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible de démarrer l'analyse.");
    }
  };

  if (meetingLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Chargement de la réunion..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (meetingError || !meeting) {
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

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Retour
          </Button>
        </div>

        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDateTime(meeting.date)}
              </span>
              {meeting.location && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {meeting.location}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeAnalysis && (
              <AnalysisStatus status={activeAnalysis.status} errorMessage={activeAnalysis.error_message} />
            )}
            
            {activeAnalysis?.status === 'completed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => triggerAnalysis(true)}
                disabled={analyzeMutation.isPending}
                className="text-xs shrink-0"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Recalculer
              </Button>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Side: Summary results */}
          <div className="lg:col-span-2 space-y-6">
            {!activeAnalysis && !analyzeMutation.isPending && (
              <Card className="border-dashed p-12 text-center flex flex-col items-center justify-center">
                <Sparkles className="h-10 w-10 text-blue-500 mb-3 animate-pulse" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">Résumé de réunion IA</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Générez un résumé structuré contenant les décisions, les livrables et le plan d'action de cette réunion.
                </p>
                <Button onClick={() => triggerAnalysis(false)} className="bg-[#2563EB]">
                  Générer le résumé
                </Button>
              </Card>
            )}

            {analyzeMutation.isPending && (
              <Card className="p-12 text-center flex flex-col items-center justify-center">
                <LoadingSpinner text="Initialisation de l'analyse..." />
              </Card>
            )}

            {activeAnalysis && activeAnalysis.status === 'processing' && (
              <Card className="p-12 text-center flex flex-col items-center justify-center">
                <LoadingSpinner text="L'IA analyse la réunion en arrière-plan. Cela prend généralement quelques secondes..." />
              </Card>
            )}

            {activeAnalysis && activeAnalysis.status === 'completed' && activeAnalysis.result && (
              <div className="space-y-4">
                <MeetingSummaryCard summaryData={activeAnalysis.result as any} />
              </div>
            )}

            {activeAnalysis && activeAnalysis.status === 'failed' && (
              <Card className="p-6 border-red-100 bg-red-50/20 text-center">
                <p className="text-sm text-red-600">L'analyse a échoué. Veuillez réessayer ou contacter un administrateur.</p>
                <Button onClick={() => triggerAnalysis(true)} variant="outline" className="mt-3 border-red-200 text-red-600 hover:bg-red-50">
                  Réessayer
                </Button>
              </Card>
            )}
          </div>

          {/* Right Side: Transcript */}
          <div className="space-y-6">
            <Card className="border border-gray-100 shadow-sm flex flex-col max-h-[600px]">
              <CardHeader className="border-b bg-gray-50/50 py-4">
                <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  Transcription brute
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1 text-sm text-gray-600 leading-relaxed scrollbar-thin">
                {meeting.recording_transcript ? (
                  <p className="whitespace-pre-wrap">{meeting.recording_transcript}</p>
                ) : meeting.description ? (
                  <div>
                    <p className="text-xs text-muted-foreground italic mb-2">Aucune transcription audio disponible. Analyse basée sur la description de la réunion :</p>
                    <p className="whitespace-pre-wrap font-sans text-gray-500">{meeting.description}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Aucun contenu textuel disponible pour cette réunion.</p>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </AppLayout>
  );
}
