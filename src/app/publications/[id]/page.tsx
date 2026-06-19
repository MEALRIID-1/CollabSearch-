'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ExternalLink,
  Download,
  FileText,
  BookOpen,
  Sparkles,
  FileDown,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublication } from '@/lib/hooks/use-publications';
import { PUBLICATION_TYPES } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';

export default function PublicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const publicationId = Number(id);
  const router = useRouter();
  const { data: publication, isLoading } = usePublication(publicationId);

  const handleDownloadPdf = () => {
    const pub = publication as any;
    const url = pub?.pdf_url || pub?.file_path;
    if (!url) return;

    // Nom de fichier explicite : titre + annee
    const safeTitle = (publication!.title ?? 'publication')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 80);
    const filename = `${safeTitle}_${publication!.year ?? ''}.pdf`;

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement de la publication..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!publication) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Publication introuvable</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/publications')}>
            Retour aux publications
          </Button>
        </div>
      </AppLayout>
    );
  }

  const typeInfo = PUBLICATION_TYPES[publication.type];
  const pub = publication as any;
  const pdfUrl = pub.pdf_url || pub.file_path || null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/publications')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge className={cn('text-xs', typeInfo.bgColor)}>{typeInfo.label}</Badge>
              <span className="text-sm text-muted-foreground">{publication.year}</span>
            </div>
            <h1 className="text-2xl font-bold">{publication.title}</h1>
            <p className="text-muted-foreground mt-2">
              {Array.isArray(pub.authors)
                ? pub.authors.join(', ')
                : pub.authors_list ?? publication.authors}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/publications/${publication.id}/analysis`}>
            <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white" size="sm">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Analyser par l'IA
            </Button>
          </Link>
        </div>

        {/* Metadata */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Metadonnees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publication.journal && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Journal</p>
                    <p className="text-sm font-medium">{publication.journal}</p>
                  </div>
                </div>
              )}
              {pub.conference_name && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conference</p>
                    <p className="text-sm font-medium">{pub.conference_name}</p>
                  </div>
                </div>
              )}
              {publication.doi && (
                <div className="flex items-start gap-3">
                  <ExternalLink className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">DOI</p>
                    <a
                      href={`https://doi.org/${publication.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#2563EB] hover:underline"
                    >
                      {publication.doi}
                    </a>
                  </div>
                </div>
              )}
              {publication.project && (
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Projet associe</p>
                    <Link
                      href={`/projects/${publication.project.id}`}
                      className="text-sm font-medium text-[#2563EB] hover:underline"
                    >
                      {publication.project.title}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Abstract */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {publication.abstract || 'Aucun resume disponible'}
            </p>
          </CardContent>
        </Card>

        {/* PDF */}
        {pdfUrl && (
          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-500" />
                <CardTitle className="text-base">Fichier PDF</CardTitle>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadPdf}
                className="gap-1.5 border-[#2563EB] text-[#2563EB] hover:bg-blue-50"
              >
                <FileDown className="h-4 w-4" />
                Telecharger
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden rounded-b-lg">
              {/* Bande d'info sur le fichier */}
              <div className="px-6 py-3 bg-gray-50 border-t border-b flex items-center gap-3">
                <FileText className="h-8 w-8 text-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {publication.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {typeInfo.label}
                    {publication.year ? ` · ${publication.year}` : ''}
                    {Array.isArray(pub.authors) && pub.authors.length > 0
                      ? ` · ${pub.authors[0]}${pub.authors.length > 1 ? ' et al.' : ''}`
                      : ''}
                  </p>
                </div>
              </div>
              {/* Apercu PDF */}
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                className="w-full"
                style={{ height: '500px', border: 'none' }}
                title={publication.title}
              />
            </CardContent>
          </Card>
        )}

        {/* Keywords */}
        {publication.keywords && publication.keywords.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Mots-cles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {publication.keywords.map((keyword, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
