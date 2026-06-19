'use client';

import { useState } from 'react';
import { PermissionGate } from '@/components/shared/permission-gate';
import {
  X,
  Edit,
  Play,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  User,
  Paperclip,
  MessageSquare,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KANBAN_COLUMNS, TASK_PRIORITIES } from '@/lib/utils/constants';
import { formatDate, formatFileSize, getInitials } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import {
  useTask,
  useTaskComments,
  useAddComment,
  useUpdateTaskStatus,
  useValidateTask,
  useRefuseTask,
} from '@/lib/hooks/use-tasks';
import { TaskComment } from './task-comment';
import { TaskForm } from './task-form';
import { SubmitProofModal } from './submit-proof-modal';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import type { Attachment, TaskStatus } from '@/types/models';

interface TaskDetailPanelProps {
  taskId: number;
  open: boolean;
  onClose: () => void;
}

export function TaskDetailPanel({ taskId, open, onClose }: TaskDetailPanelProps) {
  const { data: task, isLoading } = useTask(taskId);
  const { data: comments } = useTaskComments(taskId);
  const addComment = useAddComment();
  const updateStatus = useUpdateTaskStatus();
  const validateTask = useValidateTask();
  const refuseTask = useRefuseTask();

  const { user } = useAuthStore();
  // can_review vient du backend ; fallback sur les rôles du store si cache périmé
  const canReview = task?.can_review
    || user?.roles?.includes('administrator')
    || user?.roles?.includes('team_lead')
    || false;

  const [commentText, setCommentText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const handleDownload = async (attachment: Attachment) => {
    try {
      const token = Cookies.get('collabsearch_token');
      const response = await fetch(attachment.url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Téléchargement échoué');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.original_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // Silently ignore
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ taskId, content: commentText.trim() });
      setCommentText('');
    } catch {
      // handled by mutation
    }
  };

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      await updateStatus.mutateAsync({ id: taskId, status });
    } catch {
      // handled by mutation
    }
  };

  const handleValidate = async () => {
    try {
      await validateTask.mutateAsync(taskId);
    } catch {
      // handled by mutation
    }
  };

  const handleRefuse = async () => {
    try {
      await refuseTask.mutateAsync(taskId);
    } catch {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-xl border-l">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner text="Chargement..." />
        </div>
      </div>
    );
  }

  if (!task) return null;

  const statusInfo = KANBAN_COLUMNS[task.status];
  const priorityInfo = TASK_PRIORITIES[task.priority];
  const isReviewableStatus = task.status === 'submitted' || task.status === 'validated' || task.status === 'refused';

  if (isEditing) {
    return (
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-xl border-l overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Modifier la tâche</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <TaskForm
            projectId={task.project_id}
            task={task}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-xl border-l transform transition-transform duration-300 overflow-y-auto',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 pr-4">
              <h2 className="text-lg font-semibold">{task.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  className="text-xs"
                  style={{ backgroundColor: statusInfo.color + '20', color: statusInfo.color }}
                >
                  {statusInfo.label}
                </Badge>
                <Badge variant="secondary" className={cn('text-xs', priorityInfo.bgColor)}>
                  {priorityInfo.label}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsEditing(true)}
                aria-label="Modifier"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Details */}
            <div className="space-y-4">
              {task.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                {task.assignee && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={task.assignee.avatar ?? undefined} />
                      <AvatarFallback className="text-[9px] bg-[#2563EB] text-white">
                        {getInitials(task.assignee.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{task.assignee.full_name}</span>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{formatDate(task.due_date)}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* ── Actions ── */}
            <div className="flex flex-wrap gap-2">
              {task.status === 'todo' && (
                <PermissionGate permission="tasks.change_status">
                  <Button
                    size="sm"
                    className="bg-[#2563EB] hover:bg-[#2563EB]/90 text-white"
                    onClick={() => handleStatusChange('in_progress')}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="mr-1 h-4 w-4" />
                    )}
                    {"Demarrer"}
                  </Button>
                </PermissionGate>
              )}

              {task.status === 'in_progress' && (
                <PermissionGate permission="tasks.change_status">
                  <Button
                    size="sm"
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() => setShowSubmitModal(true)}
                  >
                    <Send className="mr-1 h-4 w-4" />
                    Soumettre
                  </Button>
                </PermissionGate>
              )}

              {/* Valider / Refuser — visible uniquement admin & chef d'équipe */}
              {task.status === 'submitted' && canReview && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleValidate}
                    disabled={validateTask.isPending || refuseTask.isPending}
                  >
                    {validateTask.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1 h-4 w-4" />
                    )}
                    Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRefuse}
                    disabled={validateTask.isPending || refuseTask.isPending}
                  >
                    {refuseTask.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-1 h-4 w-4" />
                    )}
                    Refuser
                  </Button>
                </>
              )}

              {task.status === 'refused' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-orange-400 text-orange-700 hover:bg-orange-50"
                  onClick={() => handleStatusChange('in_progress')}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-1 h-4 w-4" />
                  )}
                  Refaire
                </Button>
              )}
            </div>

            <Separator />

            {/* ── Preuve de réalisation (soumis / validé / refusé) ── */}
            {isReviewableStatus && (
              <>
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4" />
                    Preuve de réalisation
                    {task.attachments && task.attachments.length > 0 && (
                      <span className="text-muted-foreground font-normal">
                        ({task.attachments.length})
                      </span>
                    )}
                  </h4>
                  {task.attachments && task.attachments.length > 0 ? (
                    <div className="space-y-1">
                      {task.attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                        >
                          <span className="truncate">{attachment.original_name}</span>
                          <div className="flex items-center gap-2 ml-2 shrink-0">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); handleDownload(attachment); }}
                              title="Télécharger"
                            >
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Aucune preuve jointe — tâche soumise sans fichier.</span>
                    </div>
                  )}
                </div>
                <Separator />
              </>
            )}

            {/* Pièces jointes normales (todo / in_progress) */}
            {!isReviewableStatus && task.attachments && task.attachments.length > 0 && (
              <>
                <div>
                  <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Paperclip className="h-4 w-4" />
                    Pièces jointes ({task.attachments.length})
                  </h4>
                  <div className="space-y-1">
                    {task.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <span className="truncate">{attachment.original_name}</span>
                        <div className="flex items-center gap-2 ml-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => { e.stopPropagation(); handleDownload(attachment); }}
                            title="Télécharger"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* ── Commentaires ── */}
            <div>
              <h4 className="text-sm font-medium flex items-center gap-2 mb-3">
                <MessageSquare className="h-4 w-4" />
                Commentaires {comments ? `(${comments.length})` : ''}
              </h4>

              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {comments && comments.length > 0 ? (
                  comments.map((comment) => (
                    <TaskComment key={comment.id} comment={comment} taskId={taskId} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun commentaire</p>
                )}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un commentaire…"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  disabled={addComment.isPending}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || addComment.isPending}
                >
                  {addComment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

        {/* Submit proof modal */}
        {task && (
          <SubmitProofModal
            open={showSubmitModal}
            onClose={() => setShowSubmitModal(false)}
            taskId={task.id}
          />
        )}
        </div>
      </div>
    </>
  );
}
