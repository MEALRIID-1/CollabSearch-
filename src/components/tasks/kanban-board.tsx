'use client';

import { useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useKanban, useUpdateTaskStatus } from '@/lib/hooks/use-tasks';
import { KANBAN_COLUMNS } from '@/lib/utils/constants';
import { KanbanColumn } from './kanban-column';
import { TaskDetailPanel } from './task-detail-panel';
import { TaskTrashPanel } from './task-trash-panel';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { EmptyState } from '@/components/shared/empty-state';
import type { Task, TaskStatus } from '@/types/models';

interface KanbanBoardProps {
  projectId: number;
  onEditTask?: (task: Task) => void;
  showTrash?: boolean;
  onCloseTrash?: () => void;
}

export function KanbanBoard({ projectId, onEditTask, showTrash = false, onCloseTrash }: KanbanBoardProps) {
  const { data: kanbanData, isLoading } = useKanban(projectId);
  const updateStatus = useUpdateTaskStatus();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = Number(result.draggableId);
    const newStatus = result.destination.droppableId as TaskStatus;
    updateStatus.mutate({ id: taskId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner text="Chargement du tableau..." />
      </div>
    );
  }

  if (!kanbanData) {
    return (
      <EmptyState title="Aucune tache" description="Aucune tache trouvee pour ce projet." />
    );
  }

  const columnKeys = Object.keys(KANBAN_COLUMNS) as TaskStatus[];

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
          {columnKeys.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={kanbanData[status] ?? []}
              onCardClick={(id) => setSelectedTaskId(id)}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      </DragDropContext>

      {selectedTaskId !== null && (
        <TaskDetailPanel
          taskId={selectedTaskId}
          open={true}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      <TaskTrashPanel
        projectId={projectId}
        open={showTrash}
        onClose={onCloseTrash ?? (() => {})}
      />
    </>
  );
}
