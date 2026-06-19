'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskForm } from '@/components/tasks/task-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProject } from '@/lib/hooks/use-projects';
import { toast } from 'sonner';

export default function ProjectTasksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectId = Number(id);
  const router = useRouter();
  const { data: project, isLoading } = useProject(projectId);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  const handleCreateTask = () => {
    setShowTaskDialog(false);
    toast.success('Tâche créée avec succès');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push(`/projects/${projectId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Tâches</h1>
              <p className="text-muted-foreground mt-1">
                {project?.title ?? `Projet #${projectId}`}
              </p>
            </div>
          </div>
          <Button
            className="bg-[#2563EB] hover:bg-[#2563EB]/90"
            onClick={() => setShowTaskDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle tâche
          </Button>
        </div>

        {/* Kanban board */}
        <KanbanBoard projectId={projectId} />

        {/* Create task dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle tâche</DialogTitle>
            </DialogHeader>
            <TaskForm
              projectId={projectId}
              onSuccess={handleCreateTask}
              onCancel={() => setShowTaskDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
