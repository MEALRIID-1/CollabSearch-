'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createProjectSchema,
  type CreateProjectFormData,
  type UpdateProjectFormData,
} from '@/lib/validators/project';
import { useCreateProject, useUpdateProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { Project } from '@/types/models';

interface ProjectFormProps {
  project?: Project;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProjectForm({ project, onSuccess, onCancel }: ProjectFormProps) {
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: project
      ? {
          title: project.title,
          description: project.description,
          start_date: project.start_date,
          end_date: project.end_date ?? '',
          budget_allocated: project.budget_allocated,
          members: [],
        }
      : {
          budget_allocated: 0,
          members: [],
        },
  });

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      if (isEditing && project) {
        await updateProject.mutateAsync({
          id: project.id,
          data: data as UpdateProjectFormData,
        });
      } else {
        await createProject.mutateAsync(data as CreateProjectFormData);
      }
      onSuccess?.();
    } catch {
      // Error handled by mutation
    }
  };

  const isSubmitting = createProject.isPending || updateProject.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre</Label>
        <Input
          id="title"
          placeholder="Titre du projet"
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
          placeholder="Description du projet"
          rows={4}
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date de début</Label>
          <Input id="start_date" type="date" {...register('start_date')} />
          {errors.start_date && (
            <p className="text-sm text-destructive">{errors.start_date.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_date">Date de fin</Label>
          <Input id="end_date" type="date" {...register('end_date')} />
          {errors.end_date && (
            <p className="text-sm text-destructive">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-2">
        <Label htmlFor="budget_allocated">Budget alloué (XOF)</Label>
        <Input
          id="budget_allocated"
          type="number"
          min={0}
          placeholder="0"
          {...register('budget_allocated', { valueAsNumber: true })}
          aria-invalid={!!errors.budget_allocated}
        />
        {errors.budget_allocated && (
          <p className="text-sm text-destructive">{errors.budget_allocated.message}</p>
        )}
      </div>

      {/* Members (multi-select simplified) */}
      {!isEditing && (
        <div className="space-y-2">
          <Label htmlFor="members">Membres (IDs séparés par des virgules)</Label>
          <Input
            id="members"
            placeholder="1, 2, 3"
            {...register('members', {
              setValueAs: (v: string | number | readonly number[] | undefined) => {
                if (typeof v === 'string') {
                  return v
                    .split(',')
                    .map((s) => Number(s.trim()))
                    .filter((n) => !isNaN(n));
                }

                if (Array.isArray(v)) {
                  return v.map((item) => Number(item)).filter((n) => !isNaN(n));
                }

                if (typeof v === 'number') {
                  return [v];
                }

                return undefined;
              },
            })}
          />
          {errors.members && (
            <p className="text-sm text-destructive">{String(errors.members.message)}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Mettre à jour' : 'Créer le projet'}
        </Button>
      </div>
    </form>
  );
}
