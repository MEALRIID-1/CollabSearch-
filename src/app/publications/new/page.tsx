'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PublicationForm } from '@/components/publications/publication-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function NewPublicationPage() {
  const router = useRouter();

  const handleSuccess = (publication: { id: number }) => {
    toast.success('Publication créée avec succès');
    router.push(`/publications/${publication.id}`);
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
            <h1 className="text-2xl font-bold">Nouvelle publication</h1>
            <p className="text-muted-foreground mt-1">
              Ajoutez une publication scientifique
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Informations de la publication</CardTitle>
          </CardHeader>
          <CardContent>
            <PublicationForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
