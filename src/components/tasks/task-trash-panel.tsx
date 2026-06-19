'use client';

import { Trash2, RotateCcw, X, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useTaskTrash, useRestoreTask, useForceDeleteTask } from '@/lib/hooks/use-tasks';
import { TASK_PRIORITIES } from '@/lib/utils/constants';
import { formatDate, truncateText } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Task } from '@/types/models';

interface TaskTrashPanelProps {
  projectId: number;
  open: boolean;
  onClose: () => void;
}

export function TaskTrashPanel({ projectId, open, onClose }: TaskTrashPanelProps) {
  const { data: tasks, isLoading, refetch, isFetching } = useTaskTrash(projectId);
  const restore = useRestoreTask();
  const forceDelete = useForceDeleteTask();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-white shadow-xl border-l flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-semibold">Corbeille</h2>
            {tasks && tasks.length > 0 && (
              <Badge variant="secondary" className="text-xs">{tasks.length}</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => refetch()} title="Actualiser">
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !tasks || tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2">
              <Trash2 className="h-8 w-8 opacity-30" />
              <p className="text-sm">La corbeille est vide</p>
            </div>
          ) : (
            tasks.map((task: Task) => {
              const priority = TASK_PRIORITIES[task.priority];
              return (
                <div key={task.id} className="border rounded-lg p-3 bg-gray-50 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className={cn('text-[10px] px-1.5 py-0 shrink-0', priority.bgColor)}
                        >
                          {priority.label}
                        </Badge>
                        {task.due_date && (
                          <span className="text-[11px] text-muted-foreground">
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium leading-tight">
                        {truncateText(task.title, 60)}
                      </p>
                      {task.assignee && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {task.assignee.full_name}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-7 text-xs border-emerald-400 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => restore.mutate(task.id)}
                      disabled={restore.isPending}
                    >
                      {restore.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        : <RotateCcw className="h-3 w-3 mr-1" />
                      }
                      Restaurer
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1 h-7 text-xs"
                      onClick={() => forceDelete.mutate(task.id)}
                      disabled={forceDelete.isPending}
                    >
                      {forceDelete.isPending
                        ? <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        : <AlertTriangle className="h-3 w-3 mr-1" />
                      }
                      Supprimer
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {tasks && tasks.length > 0 && (
          <div className="px-6 py-3 border-t bg-amber-50">
            <p className="text-xs text-amber-700">
              Les taches supprimees definitivement ne peuvent pas etre recuperees.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
