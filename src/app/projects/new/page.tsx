'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ProjectForm } from '@/components/projects/project-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewProjectPage() {
  const router = useRouter();

  const handleSuccess = () => {
    toast.success('Projet créé avec succès');
    router.push('/projects');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouveau projet</h1>
            <p className="text-muted-foreground mt-1">
              Créez un nouveau projet de recherche
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Informations du projet</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
