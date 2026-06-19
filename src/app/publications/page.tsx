'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { PublicationCard } from '@/components/publications/publication-card';
import { PublicationForm } from '@/components/publications/publication-form';
import { PublicationSearch } from '@/components/publications/publication-search';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePublications } from '@/lib/hooks/use-publications';
import { PUBLICATION_TYPES } from '@/lib/utils/constants';
import { PermissionGate } from '@/components/shared/permission-gate';
import type { Publication } from '@/types/models';

export default function PublicationsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState('list');
  const [publicationToEdit, setPublicationToEdit] = useState<Publication | null>(null);

  const { data: publicationsData, isLoading } = usePublications({
    search: search || undefined,
    type: typeFilter || undefined,
  });

  const publications = publicationsData?.data ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Publications</h1>
            <p className="text-muted-foreground mt-1">
              Gerez vos publications scientifiques
            </p>
          </div>
          <PermissionGate permission="publications.submit">
            <Link href="/publications/new">
              <Button className="bg-[#2563EB] hover:bg-[#2563EB]/90">
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle publication
              </Button>
            </Link>
          </PermissionGate>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="list">Toutes les publications</TabsTrigger>
            <TabsTrigger value="search">Recherche avancee</TabsTrigger>
          </TabsList>

          {/* List tab */}
          <TabsContent value="list" className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une publication..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PUBLICATION_TYPES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Publications grid */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <LoadingSpinner text="Chargement des publications..." size="lg" />
              </div>
            ) : publications.length === 0 ? (
              <EmptyState
                title="Aucune publication trouvee"
                description={
                  search || typeFilter
                    ? 'Essayez de modifier vos criteres de recherche'
                    : 'Ajoutez votre premiere publication scientifique'
                }
                actionLabel="Ajouter une publication"
                onAction={() => router.push('/publications/new')}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {publications.map((publication) => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                    onClick={() => router.push(`/publications/${publication.id}`)}
                    onEdit={(p) => setPublicationToEdit(p)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Search tab */}
          <TabsContent value="search">
            <PublicationSearch />
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!publicationToEdit} onOpenChange={(open) => { if (!open) setPublicationToEdit(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la publication</DialogTitle>
          </DialogHeader>
          {publicationToEdit && (
            <PublicationForm
              publication={publicationToEdit}
              onSuccess={() => { setPublicationToEdit(null); }}
              onCancel={() => setPublicationToEdit(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
