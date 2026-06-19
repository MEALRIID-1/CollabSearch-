'use client';

import { Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatRelative, getInitials } from '@/lib/utils/format';
import { useAuthStore } from '@/lib/stores/auth-store';
import { tasksApi } from '@/lib/api/tasks';
import { useQueryClient } from '@tanstack/react-query';
import type { TaskComment as TaskCommentType } from '@/types/models';

interface TaskCommentProps {
  comment: TaskCommentType;
  taskId: number;
}

export function TaskComment({ comment, taskId }: TaskCommentProps) {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isOwner = currentUser?.id === comment.user_id;

  const handleDelete = async () => {
    try {
      await tasksApi.deleteComment(taskId, comment.id);
      queryClient.invalidateQueries({ queryKey: ['task-comments', taskId] });
    } catch {
      // Error handled silently
    }
  };

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={comment.user.avatar ?? undefined} alt={comment.user.full_name} />
        <AvatarFallback className="text-xs bg-[#2563EB] text-white">
          {getInitials(comment.user.full_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium">{comment.user.full_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatRelative(comment.created_at)}
          </span>
          {isOwner && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              aria-label="Supprimer le commentaire"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}
