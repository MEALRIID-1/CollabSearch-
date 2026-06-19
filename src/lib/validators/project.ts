import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(255, 'Le titre ne doit pas dépasser 255 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  start_date: z.string().min(1, 'La date de début est requise'),
  end_date: z.string().optional(),
  budget_allocated: z.number().min(0, 'Le budget doit être positif'),
  members: z.array(z.number()).optional(),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(10).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget_allocated: z.number().min(0).optional(),
});

export const createMilestoneSchema = z.object({
  title: z.string().min(3, 'Le titre du jalon doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  due_date: z.string().min(1, 'La date limite est requise'),
});

export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;
export type CreateMilestoneFormData = z.infer<typeof createMilestoneSchema>;
