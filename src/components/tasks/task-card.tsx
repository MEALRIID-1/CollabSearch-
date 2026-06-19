'use client';

import { useState } from 'react';
import { Calendar, Play, Send, RotateCcw, Loader2, CheckCircle, XCircle, Paperclip, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TASK_PRIORITIES } from '@/lib/utils/constants';
import { formatDate, getInitials, truncateText } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { useUpdateTaskStatus, useValidateTask, useRefuseTask, useDeleteTask } from '@/lib/hooks/use-tasks';
import { useAuthStore } from '@/lib/stores/auth-store';
import { SubmitProofModal } from './submit-proof-modal';
import type { Task } from '@/types/models';
import Cookies from 'js-cookie';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  onEdit?: (task: Task) => void;
}

export function TaskCard({ task, onClick, onEdit }: TaskCardProps) {
  const priority = TASK_PRIORITIES[task.priority];
  const updateStatus = useUpdateTaskStatus();
  const validateTask = useValidateTask();
  const refuseTask = useRefuseTask();
  const deleteTask = useDeleteTask();
  const { user } = useAuthStore();
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const canReview = task.can_review
    || user?.roles?.includes('administrator')
    || user?.roles?.includes('team_lead')
    || false;

  const canDelete = task.status === 'todo';

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate({ id: task.id, status: 'in_progress' });
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateStatus.mutate({ id: task.id, status: 'in_progress' });
  };

  const handleOpenSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubmitModal(true);
  };

  const handleValidate = (e: React.MouseEvent) => {
    e.stopPropagation();
    validateTask.mutate(task.id);
  };

  const handleRefuse = (e: React.MouseEvent) => {
    e.stopPropagation();
    refuseTask.mutate(task.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(task);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask.mutate(task.id);
  };

  const handleDownload = async (e: React.MouseEvent, url: string, name: string) => {
    e.stopPropagation();
    try {
      const token = Cookies.get('collabsearch_token');
      const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch { /* ignore */ }
  };

  const isPending = updateStatus.isPending && updateStatus.variables?.id === task.id;
  const isReviewing = validateTask.isPending || refuseTask.isPending;

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-all duration-200 border-l-4',
          onClick && 'hover:-translate-y-0.5'
        )}
        style={{ borderLeftColor: priority.color }}
        onClick={onClick}
      >
        <CardContent className="p-3">

          {/* Ligne titre + icones action */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium leading-tight flex-1">
              {truncateText(task.title, 45)}
            </h4>
            {/* Icones modifier / supprimer — toujours visibles */}
            <div className="flex items-center gap-1 shrink-0">
              {canDelete && (
                <button
                  className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                  onClick={handleDelete}
                  disabled={deleteTask.isPending}
                  title="Supprimer"
                >
                  {deleteTask.isPending
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </button>
              )}
              <button
                className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors"
                onClick={handleEdit}
                title="Modifier"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Badge priorite + date */}
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', priority.bgColor)}>
              {priority.label}
            </Badge>
            {task.due_date && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
              {truncateText(task.description, 80)}
            </p>
          )}

          {/* Assignee */}
          {task.assignee && (
            <div className="flex items-center gap-1 mb-2">
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.avatar ?? undefined} />
                <AvatarFallback className="text-[9px] bg-[#2563EB] text-white">
                  {getInitials(task.assignee.full_name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">{task.assignee.full_name}</span>
            </div>
          )}

          {/* Soumis : preuve + boutons admin */}
          {task.status === 'submitted' && (
            <div className="mt-2 pt-2 border-t border-amber-100 space-y-2">
              {task.attachments && task.attachments.length > 0 ? (
                <div className="space-y-1">
                  {task.attachments.map((att) => (
                    <button
                      key={att.id}
                      className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline w-full text-left"
                      onClick={(e) => handleDownload(e, att.url, att.original_name)}
                    >
                      <Paperclip className="h-3 w-3 shrink-0" />
                      <span className="truncate">{att.original_name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-amber-600 italic">Aucune preuve jointe</p>
              )}

              {canReview && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="flex-1 h-6 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                    onClick={handleValidate}
                    disabled={isReviewing}
                  >
                    {validateTask.isPending
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <><CheckCircle className="h-3 w-3 mr-1" />Valider</>
                    }
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="flex-1 h-6 text-[11px] px-2"
                    onClick={handleRefuse}
                    disabled={isReviewing}
                  >
                    {refuseTask.isPending
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : <><XCircle className="h-3 w-3 mr-1" />Refuser</>
                    }
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          {task.status === 'todo' && (
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="ghost"
                className="h-6 text-[11px] px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleStart} disabled={isPending}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 mr-1" />}
                Demarrer
              </Button>
            </div>
          )}
          {task.status === 'in_progress' && (
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="ghost"
                className="h-6 text-[11px] px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={handleOpenSubmit} disabled={isPending}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3 mr-1" />}
                Soumettre
              </Button>
            </div>
          )}
          {task.status === 'refused' && (
            <div className="flex justify-end mt-2">
              <Button size="sm" variant="ghost"
                className="h-6 text-[11px] px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                onClick={handleRetry} disabled={isPending}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3 mr-1" />}
                Refaire
              </Button>
            </div>
          )}

        </CardContent>
      </Card>

      <SubmitProofModal
        taskId={task.id}
        open={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
    </>
  );
}
