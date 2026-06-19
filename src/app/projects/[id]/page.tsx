'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Send,
  CheckCircle2,
  XCircle,
  Archive,
  Plus,
  FileText,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { ProjectStats } from '@/components/projects/project-stats';
import { MilestoneList } from '@/components/projects/milestone-list';
import { ProjectMembers } from '@/components/projects/project-members';
import { KanbanBoard } from '@/components/tasks/kanban-board';
import { TaskForm } from '@/components/tasks/task-form';
import { BudgetChart } from '@/components/budget/budget-chart';
import { BudgetGauge } from '@/components/budget/budget-gauge';
import { BudgetLineTable } from '@/components/budget/budget-line-table';
import { BudgetLineForm } from '@/components/budget/budget-line-form';
import { PublicationCard } from '@/components/publications/publication-card';
import { PublicationForm } from '@/components/publications/publication-form';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PermissionGate } from '@/components/shared/permission-gate';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useProject, useProjectWorkflow } from '@/lib/hooks/use-projects';
import { usePublications } from '@/lib/hooks/use-publications';
import { useCreateBudgetLine } from '@/lib/hooks/use-budget';
import { useCreateTask } from '@/lib/hooks/use-tasks';
import type { Task, Publication } from '@/types/models';
import { useAuthStore } from '@/lib/stores/auth-store';
import { usePermissions } from '@/lib/hooks/use-permissions';
import { PROJECT_STATUSES } from '@/lib/utils/constants';
import { formatDate, formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { toast } from 'sonner';

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectId = Number(id);
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const { can, isAdmin } = usePermissions();

  const { data: project, isLoading } = useProject(projectId);
  const workflow = useProjectWorkflow();
  const createTask = useCreateTask();
  const createBudgetLine = useCreateBudgetLine();
  const { data: publicationsData } = usePublications({ search: undefined });

  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [showBudgetDialog, setShowBudgetDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showTrash, setShowTrash] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [publicationToEdit, setPublicationToEdit] = useState<Publication | null>(null);

  if (isLoading || !project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement du projet..." size="lg" />
        </div>
      </AppLayout>
    );
  }

  const statusInfo = PROJECT_STATUSES[project.status];
  const isOwner = currentUser?.id === project.lead_id;
  const isOwnerOrAdmin = isOwner || isAdmin;

  const canSubmit = project.status === 'draft' && (isOwnerOrAdmin || can('projects.submit'));
  const canApprove = project.status === 'submitted' && (isAdmin || can('projects.approve'));
  const canReject = project.status === 'submitted' && (isAdmin || can('projects.reject'));
  const canArchive = (project.status === 'approved' || project.status === 'active') && (isOwnerOrAdmin || can('projects.archive'));

  const handleWorkflowAction = async (action: 'submit' | 'approve' | 'reject' | 'archive') => {
    try {
      if (action === 'reject') {
        await workflow.mutateAsync({ action, id: projectId, data: { reason: rejectReason } });
        setShowRejectDialog(false);
        setRejectReason('');
      } else {
        await workflow.mutateAsync({ action, id: projectId });
      }
      const actionLabels: Record<string, string> = {
        submit: 'soumis',
        approve: 'approuve',
        reject: 'rejete',
        archive: 'archive',
      };
      toast.success(`Projet ${actionLabels[action]} avec succes`);
    } catch {
      toast.error("Erreur lors de l'action");
    }
  };

  const handleCreateTask = async () => {
    setShowTaskDialog(false);
    toast.success('Tache creee avec succes');
  };

  const handleCreateBudgetLine = async () => {
    setShowBudgetDialog(false);
    toast.success('Ligne budgetaire ajoutee');
  };

  const projectPublications = publicationsData?.data?.filter((p) => {
    const pid = (p as any).project_id ?? (p as any).project?.id;
    return pid === projectId;
  }) ?? [];

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/projects')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{project.title}</h1>
                <Badge className={cn('text-xs', statusInfo.bgColor)}>{statusInfo.label}</Badge>
              </div>
              <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Debut : {formatDate(project.start_date)}</span>
                {project.end_date && <span>Fin : {formatDate(project.end_date)}</span>}
                <span>Budget : {formatCurrency(project.budget_allocated)}</span>
              </div>
            </div>
          </div>

          {/* Workflow actions */}
          <div className="flex flex-wrap gap-2">
            {(isOwnerOrAdmin || can('projects.edit')) && (
              <Link href={`/projects/${projectId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="mr-1 h-4 w-4" />
                  Modifier
                </Button>
              </Link>
            )}
            {canSubmit && (
              <Button
                size="sm"
                className="bg-[#f59e0b] hover:bg-[#f59e0b]/90"
                onClick={() => handleWorkflowAction('submit')}
                disabled={workflow.isPending}
              >
                <Send className="mr-1 h-4 w-4" />
                Soumettre
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                className="bg-[#10B981] hover:bg-[#10B981]/90 text-white"
                onClick={() => handleWorkflowAction('approve')}
                disabled={workflow.isPending}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approuver
              </Button>
            )}
            {canReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
                disabled={workflow.isPending}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Rejeter
              </Button>
            )}
            {canArchive && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleWorkflowAction('archive')}
                disabled={workflow.isPending}
              >
                <Archive className="mr-1 h-4 w-4" />
                Archiver
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="tasks">Taches</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
            <TabsTrigger value="publications">Publications</TabsTrigger>
            <TabsTrigger value="members">Membres</TabsTrigger>
          </TabsList>

          {/* Overview tab */}
          <TabsContent value="overview" className="space-y-6">
            <ProjectStats project={project} />
            <MilestoneList projectId={projectId} />
          </TabsContent>

          {/* Tasks tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Tableau Kanban</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setShowTrash(true)}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Corbeille
                </Button>
                <PermissionGate permission={['projects.manage_tasks', 'tasks.create']}>
                  <Button
                    size="sm"
                    className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                    onClick={() => setShowTaskDialog(true)}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Nouvelle tache
                  </Button>
                </PermissionGate>
              </div>
            </div>
            <KanbanBoard
              projectId={projectId}
              onEditTask={(task) => setTaskToEdit(task)}
              showTrash={showTrash}
              onCloseTrash={() => setShowTrash(false)}
            />
          </TabsContent>

          {/* Budget tab */}
          <TabsContent value="budget" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Budget</h2>
              <Button
                size="sm"
                className="bg-[#2563EB] hover:bg-[#2563EB]/90"
                onClick={() => setShowBudgetDialog(true)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Ajouter une ligne
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BudgetChart projectId={projectId} />
              <BudgetGauge projectId={projectId} />
            </div>
            <BudgetLineTable projectId={projectId} />
          </TabsContent>

          {/* Publications tab */}
          <TabsContent value="publications" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Publications</h2>
              <Link href={`/publications/new?project_id=${projectId}`}>
                <Button size="sm" className="bg-[#2563EB] hover:bg-[#2563EB]/90">
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter une publication
                </Button>
              </Link>
            </div>
            {projectPublications.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucune publication"
                description="Aucune publication n'a ete ajoutee a ce projet"
                actionLabel="Ajouter une publication"
                onAction={() => router.push(`/publications/new?project_id=${projectId}`)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projectPublications.map((publication) => (
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

          {/* Members tab */}
          <TabsContent value="members">
            <ProjectMembers project={project} />
          </TabsContent>
        </Tabs>

        {/* Create task dialog */}
        <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle tache</DialogTitle>
            </DialogHeader>
            <TaskForm
              projectId={projectId}
              onSuccess={handleCreateTask}
              onCancel={() => setShowTaskDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Edit task dialog */}
        <Dialog open={!!taskToEdit} onOpenChange={(open) => { if (!open) setTaskToEdit(null); }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier la tache</DialogTitle>
            </DialogHeader>
            {taskToEdit && (
              <TaskForm
                projectId={projectId}
                task={taskToEdit}
                onSuccess={() => { setTaskToEdit(null); toast.success('Tache modifiee avec succes'); }}
                onCancel={() => setTaskToEdit(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Create budget line dialog */}
        <Dialog open={showBudgetDialog} onOpenChange={setShowBudgetDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter une ligne budgetaire</DialogTitle>
            </DialogHeader>
            <BudgetLineForm
              projectId={projectId}
              onSuccess={handleCreateBudgetLine}
              onCancel={() => setShowBudgetDialog(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Reject dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Rejeter le projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Veuillez fournir une raison pour le rejet.</p>
              <textarea
                className="w-full border rounded p-2 text-sm min-h-[80px]"
                placeholder="Raison du rejet..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Annuler</Button>
              <Button variant="destructive" onClick={() => { handleWorkflowAction('reject'); setShowRejectDialog(false); }}>
                Rejeter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
