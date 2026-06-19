'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { createTaskSchema, updateTaskSchema, type CreateTaskFormData, type UpdateTaskFormData } from '@/lib/validators/task';
import { useCreateTask, useUpdateTask } from '@/lib/hooks/use-tasks';
import { usersApi } from '@/lib/api/users';
import { projectsApi } from '@/lib/api/projects';
import { TASK_PRIORITIES, KANBAN_COLUMNS, USER_ROLES } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils/format';
import type { Task, TaskStatus, TaskPriority } from '@/types/models';

interface TaskFormProps {
  projectId: number;
  task?: Task;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TaskForm({ projectId, task, onSuccess, onCancel }: TaskFormProps) {
  const isEditing = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  // Membres accessibles (admin + ses utilisateurs)
  const { data: usersData } = useQuery({
    queryKey: ['users-for-assignment'],
    queryFn: () => usersApi.list({ per_page: 100 }),
    staleTime: 60_000,
  });
  const members = usersData?.data ?? [];

  // Jalons du projet
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: () => projectsApi.getMilestones(projectId),
    staleTime: 60_000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateTaskFormData | UpdateTaskFormData>({
    resolver: zodResolver(isEditing ? updateTaskSchema : createTaskSchema),
    defaultValues: task
      ? {
          title: task.title,
          description: task.description,
          priority: task.priority,
          status: task.status,
          due_date: task.due_date ?? '',
          assignee_id: task.assignee_id ?? undefined,
          milestone_id: task.milestone_id ?? undefined,
        }
      : {
          project_id: projectId,
          priority: 'medium',
        },
  });

  const onSubmit = async (data: CreateTaskFormData | UpdateTaskFormData) => {
    try {
      if (isEditing && task) {
        const updateData = { ...data };
        if ('assignee_id' in updateData && updateData.assignee_id == null) {
          delete (updateData as Record<string, unknown>).assignee_id;
        }
        await updateTask.mutateAsync({ id: task.id, data: updateData as UpdateTaskFormData });
      } else {
        await createTask.mutateAsync(data as CreateTaskFormData);
      }
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const isSubmitting = createTask.isPending || updateTask.isPending;
  const assigneeIdValue = watch('assignee_id' as keyof (CreateTaskFormData | UpdateTaskFormData)) as number | undefined;
  const milestoneIdValue = watch('milestone_id' as keyof (CreateTaskFormData | UpdateTaskFormData)) as number | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          placeholder="Titre de la tâche"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Description de la tâche"
          rows={3}
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Priority & Status row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Priorité</Label>
          <Select
            value={watch('priority' as keyof (CreateTaskFormData | UpdateTaskFormData)) as string}
            onValueChange={(value) => setValue('priority', value as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TASK_PRIORITIES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>

        {isEditing && (
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={watch('status' as keyof UpdateTaskFormData) as string}
              onValueChange={(value) => setValue('status', value as TaskStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(KANBAN_COLUMNS).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Due date & Assignee row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="due_date">Date limite</Label>
          <Input id="due_date" type="date" {...register('due_date')} />
        </div>

        {/* Assigné à — liste déroulante avec nom + rôle */}
        <div className="space-y-2">
          <Label>Assigné à</Label>
          <Select
            value={assigneeIdValue ? String(assigneeIdValue) : 'none'}
            onValueChange={(val) =>
              setValue('assignee_id', val === 'none' ? undefined : Number(val))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un membre" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Aucun —</SelectItem>
              {members.map((u) => {
                const roleKey = u.roles?.[0];
                const roleLabel = roleKey && USER_ROLES[roleKey] ? USER_ROLES[roleKey].label : null;
                return (
                  <SelectItem key={u.id} value={String(u.id)}>
                    <span className="flex items-center gap-2">
                      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-medium text-white">
                        {getInitials(u.full_name)}
                      </span>
                      <span className="font-medium">{u.full_name}</span>
                      {roleLabel && (
                        <span className="text-xs text-muted-foreground">· {roleLabel}</span>
                      )}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {errors.assignee_id && (
            <p className="text-sm text-destructive">{errors.assignee_id.message}</p>
          )}
        </div>
      </div>

      {/* Jalon — liste déroulante */}
      <div className="space-y-2">
        <Label>Jalon</Label>
        <Select
          value={milestoneIdValue ? String(milestoneIdValue) : 'none'}
          onValueChange={(val) =>
            setValue('milestone_id', val === 'none' ? undefined : Number(val))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un jalon (optionnel)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— Aucun jalon —</SelectItem>
            {milestones.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.title}
                {m.due_date && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    · {new Date(m.due_date).toLocaleDateString('fr-FR')}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Mettre à jour' : 'Créer la tâche'}
        </Button>
      </div>
    </form>
  );
}
