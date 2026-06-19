'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { KANBAN_COLUMNS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils/cn';
import { TaskCard } from './task-card';
import type { Task, TaskStatus } from '@/types/models';

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onCardClick?: (taskId: number) => void;
  onEditTask?: (task: Task) => void;
}

export function KanbanColumn({ status, tasks, onCardClick, onEditTask }: KanbanColumnProps) {
  const column = KANBAN_COLUMNS[status];
  const isLocked = status === 'validated' || status === 'refused';

  return (
    <div className="flex flex-col min-w-[280px] w-[280px]">
      <div
        className={cn('flex items-center justify-between rounded-t-lg px-4 py-3 border-b-4', column.bgColor)}
        style={{ borderBottomColor: column.color }}
      >
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color }} />
          <h3 className="font-semibold text-sm text-gray-800">{column.label}</h3>
        </div>
        <span className="flex items-center justify-center h-5 min-w-[20px] rounded-full bg-white text-xs font-medium text-gray-600 px-1.5 shadow-sm">
          {tasks.length}
        </span>
      </div>

      <Droppable droppableId={status} isDropDisabled={isLocked}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 rounded-b-lg bg-gray-100/50 p-2 min-h-[200px] transition-colors',
              snapshot.isDraggingOver && !isLocked && 'bg-blue-50',
              isLocked && 'opacity-90'
            )}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={String(task.id)} index={index} isDragDisabled={isLocked}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{ ...provided.draggableProps.style }}
                    className={cn('mb-2', snapshot.isDragging && 'rotate-2 scale-105 shadow-lg opacity-90')}
                  >
                    <TaskCard
                      task={task}
                      onClick={() => onCardClick?.(task.id)}
                      onEdit={onEditTask}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
