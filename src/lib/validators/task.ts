import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères').max(255),
  description: z.string().min(5, 'La description doit contenir au moins 5 caractères'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    message: 'Priorité invalide',
  }),
  due_date: z.string().optional(),
  assignee_id: z.number().optional(),
  milestone_id: z.number().optional(),
  project_id: z.number({ message: 'Le projet est requis' }),
});

export const updateTaskSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  description: z.string().min(5).optional(),
  status: z.enum(['todo', 'in_progress', 'submitted', 'validated', 'refused']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  assignee_id: z.number().optional(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Le commentaire ne peut pas être vide').max(2000, 'Le commentaire ne doit pas dépasser 2000 caractères'),
});

export type CreateTaskFormData = z.infer<typeof createTaskSchema>;
export type UpdateTaskFormData = z.infer<typeof updateTaskSchema>;
export type AddCommentFormData = z.infer<typeof addCommentSchema>;
