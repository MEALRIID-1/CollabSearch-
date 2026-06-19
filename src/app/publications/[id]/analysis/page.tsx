'use client';

import React, { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { usePublication } from '@/lib/hooks/use-publications';
import { useAnalyzePublicationMutation, useAiAnalysis } from '@/lib/hooks/use-ai-analysis';
import { PublicationAnalysisCard } from '@/components/ai/PublicationAnalysisCard';
import { AnalysisStatus } from '@/components/ai/AnalysisStatus';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Calendar, User, FileText, Sparkles, RefreshCw, ArrowLeft, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils/format';
import { toast } from 'sonner';

export default function PublicationAnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const publicationId = Number(id);
  const router = useRouter();

  const { data: publication, isLoading: publicationLoading, error: publicationError } = usePublication(publicationId);
  const analyzeMutation = useAnalyzePublicationMutation();

  const [analysisUuid, setAnalysisUuid] = useState<string | null>(null);

  // Poll analysis status
  const { data: analysisData, isLoading: analysisLoading } = useAiAnalysis(
    analysisUuid,
    !!analysisUuid
  );

  const activeAnalysis = analysisData?.analysis;

  // Check for existing analysis on load
  useEffect(() => {
    if (publicationId) {
      triggerAnalysis(false);
    }
  }, [publicationId]);

  const triggerAnalysis = async (force = false) => {
    try {
      const res = await analyzeMutation.mutateAsync({ publicationId, force });
      if (res.analysis?.uuid) {
        setAnalysisUuid(res.analysis.uuid);
        if (force) {
          toast.success("Nouvelle analyse bibliographique lancée.");
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Impossible de démarrer l'analyse.");
    }
  };

  if (publicationLoading) {
    return (
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner text="Chargement de la publication..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (publicationError || !publication) {
    return (
      <AppLayout>
        <EmptyState
          title="Publication introuvable"
          description="Cette publication n'existe pas ou vous n'y avez pas accès."
          actionLabel="Retour aux publications"
          onAction={() => router.push('/publications')}
        />
      </AppLayout>
    );
  }

  const authorsString = Array.isArray(publication.authors) 
    ? publication.authors.join(', ') 
    : (publication.authors as string) || '';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {/* Navigation */}
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

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
          <div className="space-y-1 flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{publication.title}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {authorsString}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {publication.year}
              </span>
              {publication.journal && <span>Journal: {publication.journal}</span>}
              {publication.conference && <span>Conférence: {publication.conference}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
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
                Réanalyser
              </Button>
            )}

            {publication.pdf_path && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/${publication.pdf_path}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
              >
                <Button variant="outline" size="sm" className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  PDF original
                </Button>
              </a>
            )}
          </div>
        </div>

        {/* Content */}
        <div>
          {!activeAnalysis && !analyzeMutation.isPending && (
            <Card className="border-dashed p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
              <Sparkles className="h-10 w-10 text-blue-500 mb-3 animate-pulse" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">Analyse bibliographique par IA</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Extrayez automatiquement les insights, la méthodologie, les résultats clés et générez un score de pertinence pour cette publication scientifique.
              </p>
              <Button onClick={() => triggerAnalysis(false)} className="bg-[#2563EB]">
                Lancer l'analyse IA
              </Button>
            </Card>
          )}

          {analyzeMutation.isPending && (
            <Card className="p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
              <LoadingSpinner text="Extraction et préparation du document..." />
            </Card>
          )}

          {activeAnalysis && activeAnalysis.status === 'processing' && (
            <Card className="p-12 text-center flex flex-col items-center justify-center max-w-2xl mx-auto">
              <LoadingSpinner text="L'IA parcourt et analyse l'article scientifique. Cela prend généralement de 5 à 15 secondes..." />
            </Card>
          )}

          {activeAnalysis && activeAnalysis.status === 'completed' && activeAnalysis.result && (
            <PublicationAnalysisCard analysisData={activeAnalysis.result as any} />
          )}

          {activeAnalysis && activeAnalysis.status === 'failed' && (
            <Card className="p-6 border-red-100 bg-red-50/20 text-center max-w-2xl mx-auto">
              <p className="text-sm text-red-600">L'extraction ou l'analyse IA a échoué. Veuillez vérifier le format de votre PDF ou réessayer.</p>
              <Button onClick={() => triggerAnalysis(true)} variant="outline" className="mt-3 border-red-200 text-red-600 hover:bg-red-50">
                Réessayer
              </Button>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
