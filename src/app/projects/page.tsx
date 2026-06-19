'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ProjectCard } from '@/components/projects/project-card';
import { ProjectForm } from '@/components/projects/project-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProjects, useCreateProject } from '@/lib/hooks/use-projects';
import { PROJECT_STATUSES } from '@/lib/utils/constants';
import { PermissionGate } from '@/components/shared/permission-gate';
import { toast } from 'sonner';

export default function ProjectsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: projectsData, isLoading } = useProjects({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const createProject = useCreateProject();

  const projects = projectsData?.data ?? [];

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    toast.success('Projet cree avec succes');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Projets</h1>
            <p className="text-muted-foreground mt-1">
              {"Gerez vos projets de recherche"}
            </p>
          </div>
          <PermissionGate permission="projects.create">
            <Button
              className="bg-[#2563EB] hover:bg-[#2563EB]/90"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau projet
            </Button>
          </PermissionGate>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROJECT_STATUSES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner text="Chargement des projets..." size="lg" />
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={undefined}
            title="Aucun projet trouve"
            description={
              search || statusFilter
                ? 'Essayez de modifier vos criteres de recherche'
                : 'Creez votre premier projet de recherche'
            }
            actionLabel="Creer un projet"
            onAction={() => setShowCreateDialog(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => router.push(`/projects/${project.id}`)}
              />
            ))}
          </div>
        )}

        {/* Create project dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau projet</DialogTitle>
            </DialogHeader>
            <ProjectForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
