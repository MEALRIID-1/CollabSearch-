import { z } from 'zod';

export const createPublicationSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caracteres').max(500),
  authors: z.string().min(3, 'Les auteurs doivent etre renseignes'),
  type: z.enum(['article', 'conference', 'these', 'rapport', 'livre'], {
    message: 'Type de publication invalide',
  }),
  journal: z.string().optional(),
  conference: z.string().optional(),
  year: z.number().min(1900, 'Annee invalide').max(new Date().getFullYear() + 1, 'Annee invalide'),
  doi: z.string().optional(),
  abstract: z.string().min(10, 'Le resume doit contenir au moins 10 caracteres'),
  keywords: z.array(z.string()).optional(),
  project_id: z.number().optional(),
});

// Schema distinct pour la mise a jour : tous les champs sont optionnels
export const updatePublicationSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caracteres').max(500).optional(),
  authors: z.string().min(3, 'Les auteurs doivent etre renseignes').optional(),
  type: z.enum(['article', 'conference', 'these', 'rapport', 'livre']).optional(),
  journal: z.string().optional(),
  conference: z.string().optional(),
  year: z.number().min(1900).max(new Date().getFullYear() + 1).optional(),
  doi: z.string().optional(),
  abstract: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  project_id: z.number().optional(),
});

export const searchPublicationSchema = z.object({
  query: z.string().min(1, 'La recherche ne peut pas etre vide'),
  type: z.enum(['article', 'conference', 'these', 'rapport', 'livre']).optional(),
  year: z.number().optional(),
});

export type CreatePublicationFormData = z.infer<typeof createPublicationSchema>;
export type UpdatePublicationFormData = z.infer<typeof updatePublicationSchema>;
export type SearchPublicationFormData = z.infer<typeof searchPublicationSchema>;
