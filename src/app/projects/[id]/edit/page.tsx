'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ProjectForm } from '@/components/projects/project-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProject } from '@/lib/hooks/use-projects';
import { toast } from 'sonner';

export default function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectId = Number(id);
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);

  const handleSuccess = () => {
    toast.success('Projet mis à jour avec succès');
    router.push(`/projects/${projectId}`);
  };

  const handleCancel = () => {
    router.push(`/projects/${projectId}`);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement du projet..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Projet introuvable</p>
          <Button variant="outline" className="mt-4" onClick={() => router.push('/projects')}>
            Retour aux projets
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${projectId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Modifier le projet</h1>
            <p className="text-muted-foreground mt-1">{project.title}</p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Informations du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm
              project={project}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
